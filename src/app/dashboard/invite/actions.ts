'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

type AccessWindow = {
    date: string        // YYYY-MM-DD
    start_time: string  // HH:MM
    end_time: string    // HH:MM
}

export async function inviteVisitor(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const needsParking = formData.get('needs_parking') === 'on'
    const accessWindowsRaw = formData.get('access_windows') as string

    if (!name) {
        return { error: 'Visitor name is required.' }
    }

    // Parse and validate access windows
    let accessWindows: AccessWindow[] = []
    try {
        accessWindows = JSON.parse(accessWindowsRaw || '[]')
    } catch {
        return { error: 'Invalid access window data.' }
    }

    if (!accessWindows || accessWindows.length === 0) {
        return { error: 'At least one access day is required.' }
    }

    // Validate each window
    for (const w of accessWindows) {
        if (!w.date || !w.start_time || !w.end_time) {
            return { error: 'Each access window must have a date, start time, and end time.' }
        }
        if (w.start_time >= w.end_time) {
            return { error: `Start time must be before end time for ${w.date}.` }
        }
    }

    // Sort windows by date — first date becomes the primary access_date for backward compat
    accessWindows.sort((a, b) => a.date.localeCompare(b.date))
    const primaryDate = accessWindows[0].date

    // Fetch user's profile to get unit_id & unit type 
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            unit_id,
            units (type)
        `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.unit_id) {
        return { error: 'User does not belong to a valid unit' }
    }

    // 1. Generate 32-bit Wiegand integer (0 to 4294967295)
    const credentialNumber = Math.floor(Math.random() * 4294967296)

    // Generate a 5-digit backup PIN
    const pinCode = Math.floor(10000 + Math.random() * 90000).toString()

    // 2. Insert visitor row (access_date = first window for backward compat)
    const visitorData = {
        owner_id: user.id,
        unit_id: profile.unit_id,
        visitor_name: name,
        visitor_email: email || null,
        access_date: primaryDate,
        credential_number: credentialNumber,
        pin_code: pinCode,
        needs_parking: needsParking,
        status: 'active'
    }

    const { data: newVisitor, error: dbError } = await supabase
        .from('visitors')
        .insert([visitorData])
        .select('id')
        .single()

    if (dbError || !newVisitor) {
        return { error: dbError?.message || 'Failed to create visitor record.' }
    }

    // 3. Bulk-insert all access windows
    const windowRows = accessWindows.map(w => ({
        visitor_id: newVisitor.id,
        access_date: w.date,
        start_time: w.start_time,
        end_time: w.end_time
    }))

    const { error: windowsError } = await supabase
        .from('visitor_access_windows')
        .insert(windowRows)

    if (windowsError) {
        console.error('Failed to insert access windows:', windowsError)
        // Non-fatal: visitor was created, continue
    }

    // Audit Log
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'INVITED_GUEST',
        details: {
            visitor_name: name,
            access_windows: accessWindows,
            needs_parking: needsParking
        }
    })

    // 4. Hardware Bridge: Send enriched payload with all windows
    const liftAccessLevel = Array.isArray(profile.units)
        ? profile.units[0]?.type
        : (profile.units as Record<string, unknown>)?.type === 'commercial' ? 'commercial' : 'residential'

    const payload = {
        action: 'add_credential',
        credential_number: credentialNumber,
        visitor_name: name,
        access_windows: accessWindows.map(w => ({
            date: w.date,
            start_time: w.start_time,
            end_time: w.end_time
        })),
        // Legacy single-date field for older firmware
        access_date: primaryDate,
        tag_type: 15,
        lift_access_level: liftAccessLevel
    }

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
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error('Hardware bridge failed:', errorText)
                await supabase.from('api_retry_queue').insert({
                    visitor_id: newVisitor.id,
                    payload: payload,
                    status: 'failed'
                })
            }
        } else {
            console.warn('Hardware bridge omitted: missing env vars EXTERNAL_API_URL or EXTERNAL_API_TOKEN')
        }
    } catch (err) {
        console.error('Hardware bridge network error:', err)
        await supabase.from('api_retry_queue').insert({
            visitor_id: newVisitor.id,
            payload: payload,
            status: 'pending'
        })
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function inviteVisitorsBulk(visitors: Array<{ name: string, email: string, date: string, needsParking: boolean }>) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

    if (!visitors || visitors.length === 0) {
        return { error: 'No visitor data provided.' }
    }

    if (visitors.length > 50) {
        return { error: 'Maximum 50 invites allowed per bulk upload.' }
    }

    // Fetch user's profile to get unit_id & type 
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
            unit_id,
            units (type)
        `)
        .eq('id', user.id)
        .single()

    if (profileError || !profile?.unit_id) {
        return { error: 'User does not belong to a valid unit' }
    }

    // Prepare array for bulk insertion
    const visitorRecords = visitors.map(v => {
        const credentialNumber = Math.floor(Math.random() * 4294967296)
        const pinCode = Math.floor(10000 + Math.random() * 90000).toString()

        return {
            owner_id: user.id,
            unit_id: profile.unit_id,
            visitor_name: v.name,
            visitor_email: v.email || null,
            access_date: v.date,
            credential_number: credentialNumber,
            pin_code: pinCode,
            needs_parking: v.needsParking,
            status: 'active'
        }
    })

    const { data: insertedVisitors, error: dbError } = await supabase
        .from('visitors')
        .insert(visitorRecords)
        .select('id, access_date, credential_number, visitor_name')

    if (dbError || !insertedVisitors) {
        return { error: dbError?.message || 'Database insert failed.' }
    }

    // Create one default all-day window per visitor (bulk uploads use single date from CSV)
    const windowRows = insertedVisitors.map(v => ({
        visitor_id: v.id,
        access_date: v.access_date,
        start_time: '06:00',
        end_time: '22:00'
    }))

    await supabase.from('visitor_access_windows').insert(windowRows)

    // Audit Log
    await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'INVITED_GUESTS_BULK',
        details: { count: visitors.length }
    })

    // Try API Push in background
    const externalUrl = process.env.EXTERNAL_API_URL
    const externalToken = process.env.EXTERNAL_API_TOKEN
    const liftAccessLevel = Array.isArray(profile.units)
        ? profile.units[0]?.type
        : (profile.units as Record<string, unknown>)?.type === 'commercial' ? 'commercial' : 'residential'

    if (externalUrl && externalToken) {
        Promise.allSettled(insertedVisitors.map(async (record) => {
            const payload = {
                action: 'add_credential',
                credential_number: record.credential_number,
                visitor_name: record.visitor_name,
                access_windows: [{ date: record.access_date, start_time: '06:00', end_time: '22:00' }],
                access_date: record.access_date,
                tag_type: 15,
                lift_access_level: liftAccessLevel
            }

            try {
                const response = await fetch(externalUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${externalToken}`
                    },
                    body: JSON.stringify(payload)
                })

                if (!response.ok) {
                    await supabase.from('api_retry_queue').insert({
                        visitor_id: record.id,
                        payload: payload,
                        status: 'failed'
                    })
                }
            } catch {
                await supabase.from('api_retry_queue').insert({
                    visitor_id: record.id,
                    payload: payload,
                    status: 'pending'
                })
            }
        })).catch(err => console.error('Bulk hardware bridge error:', err))
    }

    revalidatePath('/dashboard')
    return { success: true }
}
