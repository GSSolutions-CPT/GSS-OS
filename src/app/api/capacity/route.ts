import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { count, error } = await supabase
            .from('units')
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error('Failed to fetch units count:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ count: count || 0 })
    } catch (error) {
        console.error('Error in /api/capacity route:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
