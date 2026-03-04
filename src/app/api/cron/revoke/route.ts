import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// DEPRECATED: This route is superseded by /api/cron/expire which handles
// multi-day access windows and time-aware expiry. Redirecting to it.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Forward to the expire cron which does the same job (and more)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'

    try {
        const res = await fetch(`${baseUrl}/api/cron/expire`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        })

        if (!res.ok) {
            const errText = await res.text()
            console.error(`Failed to proxy to cron/expire. Status: ${res.status}`, errText)
            return NextResponse.json({ error: 'Failed to forward to cron/expire', detail: errText }, { status: 500 })
        }

        const data = await res.json()
        return NextResponse.json({ forwarded_to: 'cron/expire', ...data })
    } catch (err) {
        console.error('Fetch to cron/expire crashed:', err)
        return NextResponse.json({ error: 'Failed to forward to cron/expire', detail: String(err) }, { status: 500 })
    }
}
