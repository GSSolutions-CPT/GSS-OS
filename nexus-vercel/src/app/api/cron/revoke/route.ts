import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is meant to be called by a cron job (e.g. Vercel Cron)
// It finds all active guests whose access_date has passed and revokes them in Supabase
// and sends a revoke signal to the Impro hardware API.

export async function GET(request: Request) {
    // Basic authorization check (e.g., using a CRON_SECRET)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date().toISOString().split('T')[0]

    // Find active visitors from BEFORE today
    const { data: expiredVisitors, error } = await supabase
        .from('visitors')
        .select('*')
        .eq('status', 'active')
        .lt('access_date', today)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!expiredVisitors || expiredVisitors.length === 0) {
        return NextResponse.json({ message: 'No expired credentials found.' })
    }

    const revokedIds = []

    for (const visitor of expiredVisitors) {
        // 1. Mark as revoked in DB
        await supabase
            .from('visitors')
            .update({ status: 'revoked' })
            .eq('id', visitor.id)

        // 2. Call external hardware API to remove cred from Impro memory
        if (process.env.EXTERNAL_API_URL) {
            try {
                await fetch(process.env.EXTERNAL_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.EXTERNAL_API_TOKEN}`
                    },
                    body: JSON.stringify({
                        action: 'revoke_credential',
                        credential_number: visitor.credential_number
                    })
                })
            } catch {
                console.error(`Failed to push revoke for ${visitor.id} to hardware.`)
                // Ideally we'd add this to the api_retry_queue here
            }
        }

        revokedIds.push(visitor.id)
    }

    return NextResponse.json({
        message: 'Successfully purged expired credentials.',
        revoked_count: revokedIds.length,
        revoked_ids: revokedIds
    })
}
