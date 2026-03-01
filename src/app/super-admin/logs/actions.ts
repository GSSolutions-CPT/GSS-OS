'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAllLogs() {
    const supabase = await createClient()

    // Fetch all logs (or a large enough limit for export)
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
            id,
            action,
            details,
            created_at,
            profiles (
                full_name,
                role
            )
        `)
        .order('created_at', { ascending: false })
        .limit(1000) // Increase limit for export

    if (error) {
        console.error('Error fetching logs for export:', error)
        throw new Error('Failed to fetch logs')
    }

    return logs
}
