import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch pending API calls
    const { data: queue, error } = await supabase
        .from('api_retry_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!queue || queue.length === 0) return NextResponse.json({ message: 'Queue is empty.' })

    let processedCount = 0

    // Attempt to process queue
    for (const item of queue) {
        try {
            const res = await fetch(process.env.EXTERNAL_API_URL || 'http://localhost:3000/mock-hardware', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}` },
                body: JSON.stringify(item.payload)
            })

            if (res.ok) {
                // Success - update queue
                await supabase.from('api_retry_queue').update({ status: 'completed' }).eq('id', item.id)
                processedCount++
            } else {
                // Fail - increment retry count
                await supabase.from('api_retry_queue').update({
                    retry_count: item.retry_count + 1,
                    status: (item.retry_count + 1) >= 5 ? 'failed' : 'pending'
                }).eq('id', item.id)
            }
        } catch {
            // Network fail
            await supabase.from('api_retry_queue').update({
                retry_count: item.retry_count + 1,
                status: (item.retry_count + 1) >= 5 ? 'failed' : 'pending'
            }).eq('id', item.id)
        }
    }

    return NextResponse.json({ message: 'Queue processed', processed_count: processedCount })
}
