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
    try {
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

        // Generate a Wiegand-26 safe credential number (max 2^26 - 1 = 67,108,863).
        const WIEGAND26_MAX = 67_108_863
        const credentialNumber = Math.floor(Math.random() * (WIEGAND26_MAX + 1))

        // Generate a 5-digit backup PIN
        const pinCode = Math.floor(10000 + Math.random() * 90000).toString()

        // 2. Insert visitor row (access_date = first window for backward compat)
        const visitorData = {
            host_id: user.id, // Corrected from owner_id
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
            throw new Error(`Failed to insert access windows: ${windowsError.message}`)
        }

        // Audit Log
        const { error: auditError } = await supabase.from('audit_logs').insert({
            actor_id: user.id,
            action: 'INVITED_GUEST',
            details: {
                visitor_name: name,
                access_windows: accessWindows,
                needs_parking: needsParking
            }
        })

        if (auditError) {
            throw new Error(`Failed to create audit log: ${auditError.message}`)
        }

        // 4. Queue Hardware Injection (Asynchronous Pull Architecture)
        const liftAccessLevel = Array.isArray(profile.units)
            ? profile.units[0]?.type
            : (profile.units as Record<string, unknown>)?.type === 'commercial' ? 'commercial' : 'residential'

        const hardwarePayload = {
            action: 'ADD_CREDENTIAL',
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
            const { error: queueError } = await supabase.from('hardware_queue').insert({
                action_type: 'ADD_CREDENTIAL',
                payload: hardwarePayload,
                status: 'pending'
            })

            if (queueError) {
                console.error('CRITICAL: Failed to enqueue hardware injection:', queueError)
                throw new Error('Visitor was created in DB, but we failed to queue the hardware command. Please try again.')
            }
        } catch (err) {
            console.error('Database connection error during hardware queueing:', err)
            throw new Error('Visitor was created, but the hardware queue is currently unreachable.')
        }

        revalidatePath('/dashboard')
    } catch (err: unknown) {
        console.error('inviteVisitor Error:', err)
        return { error: err instanceof Error ? err.message : 'Unknown error' }
    }

    // Extracted redirect out of the try-catch block due to how Next.js navigation works inherently.
    redirect('/dashboard')
}

export async function inviteVisitorsBulk(visitors: Array<{ name: string, email: string, date: string, needsParking: boolean }>) {
    try {
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
                host_id: user.id, // Corrected from owner_id
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

        const { error: windowsError } = await supabase.from('visitor_access_windows').insert(windowRows)
        if (windowsError) {
            throw new Error(`Failed to insert access windows for bulk upload: ${windowsError.message}`)
        }

        // Audit Log
        const { error: auditError } = await supabase.from('audit_logs').insert({
            actor_id: user.id,
            action: 'INVITED_GUESTS_BULK',
            details: { count: visitors.length }
        })
        if (auditError) {
            throw new Error(`Failed to create bulk audit log: ${auditError.message}`)
        }

        // Try API Push in background -> Modified to Hardware Queue
        const liftAccessLevel = Array.isArray(profile.units)
            ? profile.units[0]?.type
            : (profile.units as Record<string, unknown>)?.type === 'commercial' ? 'commercial' : 'residential'

        const hardwareItems = insertedVisitors.map(record => ({
            action_type: 'ADD_CREDENTIAL',
            status: 'pending',
            payload: {
                action: 'ADD_CREDENTIAL',
                credential_number: record.credential_number,
                visitor_name: record.visitor_name,
                access_windows: [{ date: record.access_date, start_time: '06:00', end_time: '22:00' }],
                access_date: record.access_date,
                tag_type: 15,
                lift_access_level: liftAccessLevel
            }
        }))

        try {
            const { error: queueError } = await supabase.from('hardware_queue').insert(hardwareItems)
            if (queueError) {
                console.error('CRITICAL: Bulk upload failed to enqueue hardware items:', queueError)
                return { error: 'Visitors created in DB, but failed to queue hardware updates. Contact support.' }
            }
        } catch (err) {
            console.error('CRITICAL: Database connection error during bulk hardware queueing:', err)
            return { error: 'Database error queuing hardware commands.' }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (err: unknown) {
        console.error('inviteVisitorsBulk Error:', err)
        return { error: err instanceof Error ? err.message : 'Unknown error' }
    }
}
