'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitStidRequest(formData: FormData) {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { error: 'Not authenticated' }
        }

        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const role = formData.get('role') as string

        if (!name || !email || !role) {
            return { error: 'Missing required fields' }
        }

        // Fetch user's profile to get unit_id context 
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('unit_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile?.unit_id) {
            return { error: 'User does not belong to a valid unit' }
        }

        // Since we don't have a dedicated table, we use the audit_logs to store the request
        // The Super Admin will be able to see this request in the logs
        const { error: insertError } = await supabase.from('audit_logs').insert({
            actor_id: user.id,
            action: 'STID_REQUEST',
            details: {
                unit_id: profile.unit_id,
                name,
                email,
                phone: phone || null,
                requested_role: role,
                status: 'pending'
            }
        })

        if (insertError) {
            console.error('Failed to log STid request:', insertError)
            throw new Error(`Failed to submit STid request: ${insertError.message}`)
        }

        // Note: If Resend was fully configured, we would also trigger an email to the Super Admin here

        revalidatePath('/dashboard/stid')

        return { success: true }
    } catch (err: unknown) {
        console.error('submitStidRequest Error:', err)
        return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
}
