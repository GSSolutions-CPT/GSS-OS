'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function revokeVisitor(visitorId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // RLS policy ensures users can only update their own visitors
    const { error } = await supabase
        .from('visitors')
        .update({ status: 'revoked' })
        .eq('id', visitorId)

    if (error) {
        return { error: error.message }
    }

    // Audit Log Creation
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'REVOKE_PASS',
        details: { visitor_id: visitorId, method: 'manual' }
    })

    revalidatePath('/dashboard')
    return { success: true }
}
