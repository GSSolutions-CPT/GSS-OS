import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// DEPRECATED: This route is superseded by /api/cron/expire which handles
// multi-day access windows and time-aware expiry. Redirecting to it.
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
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
        const data = await res.json()
        return NextResponse.json({ forwarded_to: 'cron/expire', ...data })
    } catch (err) {
        return NextResponse.json({ error: 'Failed to forward to cron/expire', detail: String(err) }, { status: 500 })
    }
}
