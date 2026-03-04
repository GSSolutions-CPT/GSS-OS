import { NextResponse } from 'next/server'
import { adminAuthClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

interface RetryQueueItem {
    id: string
    visitor_id: string
    action: string
    status: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any
    retry_count?: number
    created_at: string
}

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Fallback assert configs, but use standardized client wrapper
    if (!supabaseUrl || !supabaseServiceKey) {
        return NextResponse.json({ error: 'Supabase env incomplete' }, { status: 500 })
    }

    const supabase = adminAuthClient

    const externalUrl = process.env.EXTERNAL_API_URL
    const externalToken = process.env.EXTERNAL_API_TOKEN

    // Fetch pending API calls
    const { data: rawQueue, error } = await supabase
        .from('api_retry_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rawQueue || rawQueue.length === 0) return NextResponse.json({ message: 'Queue is empty.' })

    if (!externalUrl || !externalToken) {
        return NextResponse.json({ error: 'Hardware bridge not configured.' }, { status: 503 })
    }

    const queue = rawQueue as RetryQueueItem[]
    let processedCount = 0

    for (const item of queue) {
        // Determine the correct HTTP method based on the action in the payload.
        // 'remove_credential' = credential deletion → DELETE
        // All other actions (add_credential, open_gate, etc.) → POST
        const isDeleteAction = item.payload?.action === 'remove_credential'
        const method = isDeleteAction ? 'DELETE' : 'POST'

        try {
            const res = await fetch(externalUrl, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${externalToken}`
                },
                body: JSON.stringify(item.payload)
            })

            if (res.ok) {
                const { error: updateError } = await supabase
                    .from('api_retry_queue')
                    .update({ status: 'completed' })
                    .eq('id', item.id)
                if (updateError) {
                    console.error(`Failed to mark retry item ${item.id} completed`, updateError)
                } else {
                    processedCount++
                }
            } else {
                const newRetryCount = (item.retry_count || 0) + 1
                const { error: updateError } = await supabase.from('api_retry_queue').update({
                    retry_count: newRetryCount,
                    status: newRetryCount >= 5 ? 'failed' : 'pending'
                }).eq('id', item.id)
                if (updateError) console.error(`Failed to increment retry count for item ${item.id}`, updateError)
            }
        } catch (err) {
            console.error(`Fetch failed for retry item ${item.id}`, err)
            const newRetryCount = (item.retry_count || 0) + 1
            const { error: updateError } = await supabase.from('api_retry_queue').update({
                retry_count: newRetryCount,
                status: newRetryCount >= 5 ? 'failed' : 'pending'
            }).eq('id', item.id)
            if (updateError) console.error(`Failed to increment retry count for item ${item.id}`, updateError)
        }
    }

    return NextResponse.json({
        message: 'Queue processed',
        processed_count: processedCount,
        total_queued: queue.length
    })
}
