import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // 1. Verify Vercel Cron Secret for authorization
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = await createClient()

    try {
        // 2. Find active visitors whose LAST access window has ended
        // A visitor with future windows must NOT be expired.
        // We use a subquery: active visitors who have no window in the future.
        const now = new Date()
        const todayStr = now.toLocaleDateString('en-CA') // YYYY-MM-DD
        const currentTime = now.toTimeString().slice(0, 5) // HH:MM

        // First, get all active visitors
        const { data: activeVisitors, error: fetchError } = await supabase
            .from('visitors')
            .select('id, credential_number, status')
            .eq('status', 'active')

        if (fetchError) throw fetchError

        if (!activeVisitors || activeVisitors.length === 0) {
            return NextResponse.json({ success: true, message: 'No active visitors found.', count: 0 })
        }

        let expiredCount = 0
        let successCount = 0

        for (const visitor of activeVisitors) {
            // Check if all access windows for this visitor have passed
            const { data: futureWindows, error: windowError } = await supabase
                .from('visitor_access_windows')
                .select('id, access_date, end_time')
                .eq('visitor_id', visitor.id)
                .or(
                    // Future date, OR today with end_time still in future
                    `access_date.gt.${todayStr},and(access_date.eq.${todayStr},end_time.gte.${currentTime})`
                )

            if (windowError) {
                console.error(`Error checking windows for visitor ${visitor.id}:`, windowError)
                continue
            }

            // If there are windows in the future, skip this visitor
            if (futureWindows && futureWindows.length > 0) {
                continue
            }

            // Also check the legacy access_date for visitors without windows
            const { data: windows } = await supabase
                .from('visitor_access_windows')
                .select('id')
                .eq('visitor_id', visitor.id)

            // If visitor has no windows at all, fall back to legacy access_date comparison
            // (handled by the legacy cron logic below using access_date column)

            expiredCount++

            // 3. Mark in DB as expired
            const { error: updateError } = await supabase
                .from('visitors')
                .update({ status: 'expired' })
                .eq('id', visitor.id)

            if (!updateError) {
                // 4. Queue Hardware Revocation (Asynchronous Pull Architecture)
                const hardwarePayload = {
                    action: 'remove_credential',
                    credential_number: visitor.credential_number,
                    tag_type: 15
                }

                const { error: queueError } = await supabase.from('hardware_queue').insert({
                    action_type: 'REVOKE_CREDENTIAL',
                    payload: hardwarePayload,
                    status: 'pending'
                })

                if (queueError) {
                    console.error(`Failed to enqueue hardware revocation for visitor ${visitor.id}:`, queueError)
                } else {
                    successCount++
                }
            }

            // Suppress unused variable warning
            void windows
        }

        // 6. Also expire any visitors WITHOUT access windows using legacy access_date < today
        const { data: legacyExpired } = await supabase
            .from('visitors')
            .select(`
                id, credential_number,
                visitor_access_windows!inner (id)
            `)
            .eq('status', 'active')
            .lt('access_date', todayStr)

        // Visitors with no windows whose access_date is past (can't join on no rows, so separate query)
        const { data: noWindowsVisitors } = await supabase
            .from('visitors')
            .select('id, credential_number')
            .eq('status', 'active')
            .lt('access_date', todayStr)

        if (noWindowsVisitors) {
            const legacyIds = new Set((legacyExpired || []).map(v => v.id))
            const toExpire = noWindowsVisitors.filter(v => !legacyIds.has(v.id))

            for (const visitor of toExpire) {
                const { error: legacyUpdateError } = await supabase.from('visitors').update({ status: 'expired' }).eq('id', visitor.id)
                if (legacyUpdateError) {
                    console.error(`Failed to expire legacy visitor ${visitor.id}:`, legacyUpdateError)
                } else {
                    expiredCount++
                }
            }
        }

        // Global audit log for the cron sweep
        const { error: auditError } = await supabase.from('audit_logs').insert({
            actor_id: '00000000-0000-0000-0000-000000000000',
            action: 'CRON_EXPIRATION_SWEEP',
            details: { expiredCount, successCount, checkedAt: now.toISOString() }
        })
        if (auditError) {
            console.error('Failed to write audit log for cron expiration sweep:', auditError)
        }

        return NextResponse.json({
            success: true,
            message: `Expired ${expiredCount} visitors.`,
            successCount
        })

    } catch (error) {
        console.error('Cron Expiration Error:', error)
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
