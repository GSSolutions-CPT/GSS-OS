import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const externalUrl = process.env.EXTERNAL_API_URL
    const externalToken = process.env.EXTERNAL_API_TOKEN

    // Fetch pending API calls
    const { data: queue, error } = await supabase
        .from('api_retry_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!queue || queue.length === 0) return NextResponse.json({ message: 'Queue is empty.' })

    if (!externalUrl || !externalToken) {
        return NextResponse.json({ error: 'Hardware bridge not configured.' }, { status: 503 })
    }

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
                await supabase
                    .from('api_retry_queue')
                    .update({ status: 'completed' })
                    .eq('id', item.id)
                processedCount++
            } else {
                const newRetryCount = (item.retry_count ?? 0) + 1
                await supabase.from('api_retry_queue').update({
                    retry_count: newRetryCount,
                    status: newRetryCount >= 5 ? 'failed' : 'pending'
                }).eq('id', item.id)
            }
        } catch {
            const newRetryCount = (item.retry_count ?? 0) + 1
            await supabase.from('api_retry_queue').update({
                retry_count: newRetryCount,
                status: newRetryCount >= 5 ? 'failed' : 'pending'
            }).eq('id', item.id)
        }
    }

    return NextResponse.json({
        message: 'Queue processed',
        processed_count: processedCount,
        total_queued: queue.length
    })
}
