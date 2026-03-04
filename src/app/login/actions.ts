'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in real-world apps, use zod to validate forms
    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        // You could also return this error as state if using useFormState
        return { error: error.message }
    }

    // Fetch the authenticated user's profile to determine role-based routing
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData?.user) {
        console.error('Login action failed: Could not fetch user data after successful auth', userError)
        return { error: 'Failed to verify user session.' }
    }

    const userId = userData.user.id

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

    if (profileError || !profile) {
        console.error(`Login action failed: Could not fetch profile for user ${userId}`, profileError)
        return { error: 'Failed to verify account permissions.' }
    }

    let redirectPath = '/dashboard'

    if (profile.role === 'super_admin') {
        redirectPath = '/super-admin'
    } else if (profile.role === 'guard') {
        redirectPath = '/guard'
    }

    revalidatePath(redirectPath)
    redirect(redirectPath)
}
