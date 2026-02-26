'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function inviteVisitor(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const date = formData.get('date') as string

    if (!name || !date) {
        return { error: 'Name and Access Date are required.' }
    }

    // 1. Generate 32-bit Wiegand integer (0 to 4294967295)
    const credentialNumber = Math.floor(Math.random() * 4294967296)

    // 2. Insert into Supabase
    const visitorData = {
        owner_id: user.id,
        visitor_name: name,
        visitor_email: email || null,
        access_date: date,
        credential_number: credentialNumber,
    }

    const { error: dbError } = await supabase
        .from('visitors')
        .insert([visitorData])

    if (dbError) {
        return { error: dbError.message }
    }

    // 3. Hardware Bridge: Trigger External API Call
    // We don't await this if we want a fire-and-forget, but for reliability we await
    try {
        const externalUrl = process.env.EXTERNAL_API_URL
        const externalToken = process.env.EXTERNAL_API_TOKEN

        if (externalUrl && externalToken) {
            const response = await fetch(externalUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${externalToken}`
                },
                body: JSON.stringify({
                    action: 'add_credential',
                    credential_number: credentialNumber,
                    visitor_name: name,
                    access_date: date,
                })
            })

            if (!response.ok) {
                console.error('Hardware bridge failed:', await response.text())
                // We choose not to fail the user request if external hardware is down,
                // but this could be configured based on strictness.
            }
        } else {
            console.warn('Hardware bridge omitted: missing env vars EXTERNAL_API_URL or EXTERNAL_API_TOKEN')
        }
    } catch (err) {
        console.error('Hardware bridge network error:', err)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}
