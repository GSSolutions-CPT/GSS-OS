'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revokeVisitor(visitorId: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        // Fetch visitor so we have the credential_number for the hardware call
        const { data: visitor, error: fetchError } = await supabase
            .from('visitors')
            .select('id, credential_number, status, host_id')
            .eq('id', visitorId)
            .single()

        if (fetchError || !visitor) return { error: 'Visitor not found.' }
        if (visitor.host_id !== user.id) { throw new Error('Unauthorized'); }
        if (visitor.status === 'revoked') return { error: 'Visitor is already revoked.' }

        // 1. Mark as revoked in DB (RLS ensures users can only update their own visitors)
        const { error: updateError } = await supabase
            .from('visitors')
            .update({ status: 'revoked' })
            .eq('id', visitorId)

        if (updateError) return { error: updateError.message }

        // 2. Audit Log
        const { error: auditError } = await supabase.from('audit_logs').insert({
            actor_id: user.id,
            action: 'REVOKE_PASS',
            details: { visitor_id: visitorId, method: 'manual' }
        })

        if (auditError) throw auditError;

        // 3. Queue Hardware Revocation (Asynchronous Pull Architecture)
        const hardwarePayload = {
            action: 'REVOKE_CREDENTIAL',
            credential_number: visitor.credential_number,
            tag_type: 15
        }

        const { error: queueError } = await supabase
            .from('hardware_queue')
            .insert({
                action_type: 'REVOKE_CREDENTIAL',
                payload: hardwarePayload,
                status: 'pending'
            })

        if (queueError) {
            console.error(`Failed to enqueue hardware revocation for visitor ${visitorId}:`, queueError)
            // We don't throw here because the DB is already updated to 'revoked',
            // but we log it heavily for monitoring.
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: unknown) {
        console.error('revokeVisitor Error:', error)
        return { error: (error as Error)?.message || 'An unexpected error occurred.' }
    }
}

export async function resendCredential(visitorId: string) {
    try {
        const supabase = await createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: visitor, error: fetchError } = await supabase
            .from('visitors')
            .select('id, host_id')
            .eq('id', visitorId)
            .single()

        if (fetchError || !visitor) return { error: 'Visitor not found.' }
        if (visitor.host_id !== user.id) { throw new Error('Unauthorized'); }

        const { error: auditError } = await supabase.from('audit_logs').insert({
            actor_id: user.id,
            action: 'RESEND_CREDENTIAL',
            details: { visitor_id: visitorId, method: 'manual' }
        })

        if (auditError) throw auditError;

        // TODO: Implement actual SMS/Email provider logic here

        // We don't necessarily need to revalidatePath if nothing in the UI changed, 
        // but adding it ensures absolute consistency.
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: unknown) {
        console.error('resendCredential Error:', error)
        return { error: (error as Error)?.message || 'An unexpected error occurred.' }
    }
}
