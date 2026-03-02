'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revokeVisitor(visitorId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Fetch visitor so we have the credential_number for the hardware call
    const { data: visitor, error: fetchError } = await supabase
        .from('visitors')
        .select('id, credential_number, status')
        .eq('id', visitorId)
        .single()

    if (fetchError || !visitor) return { error: 'Visitor not found.' }
    if (visitor.status === 'revoked') return { error: 'Visitor is already revoked.' }

    // 1. Mark as revoked in DB (RLS ensures users can only update their own visitors)
    const { error: updateError } = await supabase
        .from('visitors')
        .update({ status: 'revoked' })
        .eq('id', visitorId)

    if (updateError) return { error: updateError.message }

    // 2. Audit Log
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'REVOKE_PASS',
        details: { visitor_id: visitorId, method: 'manual' }
    })

    // 3. Call Impro hardware bridge to delete the credential
    const externalUrl = process.env.EXTERNAL_API_URL
    const externalToken = process.env.EXTERNAL_API_TOKEN

    if (externalUrl && externalToken) {
        const hardwarePayload = {
            action: 'remove_credential',
            credential_number: visitor.credential_number,
            tag_type: 15
        }

        try {
            const response = await fetch(externalUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${externalToken}`
                },
                body: JSON.stringify(hardwarePayload)
            })

            if (!response.ok) {
                console.error(`Impro revoke failed for visitor ${visitorId}: HTTP ${response.status}`)
                // Queue for retry so the credential gets cleaned from hardware eventually
                await supabase.from('api_retry_queue').insert({
                    visitor_id: visitorId,
                    payload: hardwarePayload,
                    status: 'pending',
                    retry_count: 0
                })
            }
        } catch (err) {
            console.error(`Impro revoke network error for ${visitorId}:`, err)
            await supabase.from('api_retry_queue').insert({
                visitor_id: visitorId,
                payload: { action: 'remove_credential', credential_number: visitor.credential_number, tag_type: 15 },
                status: 'pending',
                retry_count: 0
            })
        }
    } else {
        console.warn('Impro hardware call skipped — EXTERNAL_API_URL or EXTERNAL_API_TOKEN not configured.')
    }

    revalidatePath('/dashboard')
    return { success: true }
}
