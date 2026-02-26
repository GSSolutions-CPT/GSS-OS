import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic'; // Ensure no caching

export async function GET() {
    try {
        // Parallel Fetch
        const [attendanceRes, complianceRes, alarmRes] = await Promise.all([
            supabase.from('attendance_periods').select('*, devices(id), users(full_name)').order('created_at', { ascending: false }).limit(10),
            supabase.from('compliance_logs').select('*').order('created_at', { ascending: false }).limit(10),
            supabase.from('alarm_events').select('*').order('created_at', { ascending: false }).limit(10)
        ]);

        // Format for Frontend
        // Frontend expects: { attendance: [], compliance: [], alarms: [], visitors: [] }

        // Map Attendance to look like the mock objects
        // Mock: { device_id, credential_type, timestamp, type... }
        // DB: { id, check_in, check_out, users: { full_name }, ... }
        const attendance = (attendanceRes.data || []).flatMap((row: any) => {
            // We need to return TWO events for a completed session? Or just the row?
            // The dashboard expects a list of "events" (Check IN, Check OUT).
            // Our DB stores "Periods".
            // Let's just return the rows and let the Frontend display them as "Periods" or map them.
            // Wait, the Frontend `app/dashboard/page.tsx` code:
            // `attendance.map(record => ... record.device_id, record.type ...)`
            // The frontend was built for Event Sourcing. The DB is State based.
            // Adapter Layer:

            const events = [];
            if (row.check_in) {
                events.push({
                    id: row.id + '_in',
                    device_id: 'esp32_01', // Mock/simplified
                    credential_type: 'BLE',
                    timestamp: row.check_in,
                    type: 'CHECK_IN'
                });
            }
            if (row.check_out) {
                events.push({
                    id: row.id + '_out',
                    device_id: 'esp32_01',
                    credential_type: 'BLE',
                    timestamp: row.check_out,
                    type: 'CHECK_OUT'
                });
            }
            return events;
        });

        return NextResponse.json({
            attendance: attendance,
            compliance: complianceRes.data || [],
            alarms: alarmRes.data || [],
            visitors: [] // Not persisted
        });

    } catch (error) {
        console.error("Feed Error:", error);
        return NextResponse.json({ attendance: [], compliance: [], alarms: [], visitors: [] });
    }
}
