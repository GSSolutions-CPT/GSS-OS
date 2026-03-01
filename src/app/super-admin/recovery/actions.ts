'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRetryQueue() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('api_retry_queue')
        .select(`
            *,
            visitors (visitor_name, access_date)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching retry queue:', error)
        throw new Error('Failed to fetch retry queue')
    }

    return data
}

export async function retrySync(id: string) {
    const supabase = await createClient()

    // 1. Get the queue item
    const { data: item, error: fetchError } = await supabase
        .from('api_retry_queue')
        .select('*')
        .eq('id', id)
        .single()

    if (fetchError || !item) {
        throw new Error('Retry item not found')
    }

    // 2. Attempt the sync
    try {
        const externalUrl = process.env.EXTERNAL_API_URL
        const externalToken = process.env.EXTERNAL_API_TOKEN

        if (!externalUrl || !externalToken) {
            throw new Error('Hardware bridge configuration missing')
        }

        const response = await fetch(externalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${externalToken}`
            },
            body: JSON.stringify(item.payload)
        })

        if (response.ok) {
            // Successfully synced!
            await supabase
                .from('api_retry_queue')
                .update({ status: 'completed' })
                .eq('id', id)
        } else {
            const errorText = await response.text()
            await supabase
                .from('api_retry_queue')
                .update({
                    status: 'failed',
                    retry_count: item.retry_count + 1
                })
                .eq('id', id)
            throw new Error(`Hardware bridge error: ${errorText}`)
        }
    } catch (error) {
        await supabase
            .from('api_retry_queue')
            .update({
                status: 'failed',
                retry_count: item.retry_count + 1
            })
            .eq('id', id)
        throw new Error(error instanceof Error ? error.message : 'Network error during retry')
    }

    revalidatePath('/super-admin/recovery')
    return { success: true }
}

export async function deleteRetryItem(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('api_retry_queue')
        .delete()
        .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/super-admin/recovery')
    return { success: true }
}
