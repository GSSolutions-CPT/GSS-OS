import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const externalUrl = process.env.EXTERNAL_API_URL
    const externalToken = process.env.EXTERNAL_API_TOKEN

    if (!externalUrl) {
        return NextResponse.json(
            { status: 'disconnected', error: 'No tunnel URL configured (EXTERNAL_API_URL missing)' },
            { status: 503 }
        )
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        // Ping the bridge with the auth token.
        // A 200 OR 401 both mean the tunnel is UP — only network failure means DOWN.
        const response = await fetch(externalUrl, {
            method: 'GET',
            headers: {
                ...(externalToken ? { 'Authorization': `Bearer ${externalToken}` } : {})
            },
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        return NextResponse.json({
            status: 'connected',
            httpStatus: response.status,
            // 401 means tunnel is up but token may be wrong — still connected
            authenticated: response.ok
        })

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json(
                { status: 'disconnected', error: 'Timeout — bridge did not respond within 3s.' },
                { status: 504 }
            )
        }
        return NextResponse.json(
            { status: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 502 }
        )
    }
}
