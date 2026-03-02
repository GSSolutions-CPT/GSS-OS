import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    const supabase = await createClient()

    // Require authenticated guard/super_admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['guard', 'super_admin'].includes(profile.role)) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    const { gate_type } = await request.json() as { gate_type: 'pedestrian' | 'vehicle' }

    if (!gate_type) {
        return NextResponse.json({ error: 'gate_type is required' }, { status: 400 })
    }

    // Audit the manual override
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'GUARD_GATE_OVERRIDE',
        details: { gate_type, method: 'manual' }
    })

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
