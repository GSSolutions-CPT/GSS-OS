import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('[API] Alarm Event received:', body);

        const { event_group, zone_id, partition, status, device_id } = body;

        if (!device_id) {
            return NextResponse.json({ error: "Missing device_id" }, { status: 400 });
        }

        // Ensure we have a mock device
        // The seed data created 'paradox_panel_01' (TEXT ID). This matches our mock script?
        // Mock script sends nothing about device_id, just payload. 
        // We need to attach a device_id.

        // Check if device exists, if not, create it on the fly? No, seed data has it.

        const { data, error } = await supabase
            .from("alarm_events")
            .insert({
                device_id,
                event_group,
                zone_id,
                partition,
                raw_status: status,
                message: `Zone ${zone_id} is now ${status}`
            })
            .select()
            .single();

        if (error) {
            // If FK fails (maybe user didn't run seed?), just log error
            console.error("Alarm DB Insert Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Alarm Received', data });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
