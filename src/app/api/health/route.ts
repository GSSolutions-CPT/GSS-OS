import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const externalUrl = process.env.EXTERNAL_API_URL

    if (!externalUrl) {
        return NextResponse.json({ status: 'disconnected', error: 'No tunnel URL configured (EXTERNAL_API_URL missing)' }, { status: 503 })
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000)

        // Ping the tunnel using a simple GET request
        // Even if the endpoint requires auth and returns 401, returning a response means the tunnel is UP
        const response = await fetch(externalUrl, {
            method: 'GET',
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        return NextResponse.json({ status: 'connected', httpStatus: response.status })

    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return NextResponse.json({ status: 'disconnected', error: 'Timeout pinging local server.' }, { status: 504 })
        }
        return NextResponse.json({ status: 'disconnected', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 502 })
    }
}
