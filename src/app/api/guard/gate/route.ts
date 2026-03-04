import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const supabase = await createClient()

    // Require authenticated guard/super_admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile || !['guard', 'super_admin'].includes(profile.role)) {
        console.error('Gate override failed: Profile query error or unauthorized.', profileError)
        return new NextResponse('Forbidden', { status: 403 })
    }

    let gate_type: 'pedestrian' | 'vehicle'
    try {
        const body = await request.json()
        gate_type = body.gate_type
    } catch (err) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!gate_type) {
        return NextResponse.json({ error: 'gate_type is required' }, { status: 400 })
    }

    // Audit the manual override
    const { error: auditError } = await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'GUARD_GATE_OVERRIDE',
        details: { gate_type, method: 'manual' }
    })

    if (auditError) {
        console.error('Gate override failed: Could not write audit log.', auditError)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    // Call hardware bridge
    const externalUrl = process.env.EXTERNAL_API_URL
    const externalToken = process.env.EXTERNAL_API_TOKEN

    if (!externalUrl || !externalToken) {
        return NextResponse.json({
            success: true,
            message: 'Gate override logged (hardware bridge not configured).',
            bridgeStatus: 'not_configured'
        })
    }

    try {
        const response = await fetch(externalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${externalToken}`
            },
            body: JSON.stringify({
                action: 'open_gate',
                gate_type,
                triggered_by: user.id
            })
        })

        if (response.ok) {
            return NextResponse.json({ success: true, bridgeStatus: 'sent' })
        } else {
            const body = await response.text()
            return NextResponse.json({
                success: false,
                bridgeStatus: 'error',
                httpStatus: response.status,
                detail: body
            }, { status: 502 })
        }
    } catch (err) {
        return NextResponse.json({
            success: false,
            bridgeStatus: 'unreachable',
            detail: String(err)
        }, { status: 503 })
    }
}
