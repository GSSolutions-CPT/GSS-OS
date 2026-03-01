import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // 1. Verify Vercel Cron Secret for authorization
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET) {
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 })
        }
    } else {
        console.warn('CRON_SECRET is not set. The endpoint is currently unprotected.')
    }

    const supabase = await createClient()

    try {
        // 2. Query expired visitors: valid_to (access_date in DB) < NOW() and status is active
        // Assuming access_date is stored as YYYY-MM-DD. We compare against today's date.
        // If they were active for today, they expire tomorrow.
        const today = new Date().toISOString().split('T')[0]

        const { data: expiredVisitors, error: fetchError } = await supabase
            .from('visitors')
            .select('id, credential_number, status')
            .lt('access_date', today)
            .eq('status', 'active')

        if (fetchError) throw fetchError

        if (!expiredVisitors || expiredVisitors.length === 0) {
            return NextResponse.json({ success: true, message: 'No expired visitors found.', count: 0 })
        }

        const externalUrl = process.env.EXTERNAL_API_URL
        const externalToken = process.env.EXTERNAL_API_TOKEN

        let successCount = 0
        let retryQueueCount = 0

        for (const visitor of expiredVisitors) {
            // 3. Mark in DB as expired
            const { error: updateError } = await supabase
                .from('visitors')
                .update({ status: 'expired' })
                .eq('id', visitor.id)

            if (!updateError) {
                // 4. Try external API delete
                let deleteSuccess = false
                if (externalUrl && externalToken) {
                    try {
                        const response = await fetch(externalUrl, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${externalToken}`
                            },
                            body: JSON.stringify({
                                action: 'remove_credential',
                                credential_number: visitor.credential_number,
                                tag_type: 15
                            })
                        })
                        if (response.ok) {
                            deleteSuccess = true
                            successCount++
                        }
                    } catch (err) {
                        console.error(`Hardware API DELETE failed for visitor ${visitor.id}`, err)
                    }
                }

                // 5. If hardware bridge failed or wasn't configured, log to retry queue
                if (!deleteSuccess) {
                    await supabase.from('api_retry_queue').insert({
                        visitor_id: visitor.id,
                        action: 'delete',
                        status: 'pending'
                    })
                    retryQueueCount++
                }
            }
        }

        // Global audit log for the cron sweep
        await supabase.from('audit_logs').insert({
            actor_id: '00000000-0000-0000-0000-000000000000', // System user UUID
            action: 'CRON_EXPIRATION_SWEEP',
            details: { expiredCount: expiredVisitors.length, successCount, queueCount: retryQueueCount }
        })

        return NextResponse.json({
            success: true,
            message: `Processed ${expiredVisitors.length} expirations.`,
            successCount,
            retryQueueCount
        })

    } catch (error) {
        console.error('Cron Expiration Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
