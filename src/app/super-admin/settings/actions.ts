'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getBuildingSettings() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('building_settings')
        .select('*')
        .single()

    if (error) {
        console.error('Error fetching building settings:', error)
        return null
    }

    return data
}

export async function updateBuildingSettings(formData: {
    house_rules: string
    wifi_ssid: string
    wifi_password: string
    check_in_time: string
    check_out_time: string
}) {
    const supabase = await createClient()

    // Get the single record ID first
    const { data: current } = await supabase
        .from('building_settings')
        .select('id')
        .single()

    if (!current) {
        // If somehow missing, create it
        const { error } = await supabase
            .from('building_settings')
            .insert({ ...formData })
        if (error) throw new Error(error.message)
    } else {
        const { error } = await supabase
            .from('building_settings')
            .update({
                ...formData,
                updated_at: new Date().toISOString()
            })
            .eq('id', current.id)
        if (error) throw new Error(error.message)
    }

    revalidatePath('/super-admin/settings')
    revalidatePath('/guest') // Guest page depends on this
    return { success: true }
}
