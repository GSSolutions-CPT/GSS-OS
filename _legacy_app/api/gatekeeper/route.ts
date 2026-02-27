import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { device_id, credential_type, uuid } = body;

        console.log('[API] Gatekeeper received:', body);

        // 1. Verify Credential
        const { data: creds, error: credError } = await supabase
            .from("credentials")
            .select("user_id, valid_until, users(company_id, role)")
            .eq("type", credential_type)
            .eq("value", uuid)
            .single();

        if (credError || !creds) {
            return NextResponse.json({ error: "Invalid Credential" }, { status: 401 });
        }

        // 2. Attendance Logic
        const now = new Date();

        // Check open session
        const { data: openSession } = await supabase
            .from("attendance_periods")
            .select("*")
            .eq("user_id", creds.user_id)
            .is("check_out", null) // Supabase filter for NULL
            .order("check_in", { ascending: false })
            .limit(1)
            .single();

        let result;

        if (openSession) {
            // Clock OUT
            const checkInTime = new Date(openSession.check_in);
            const durationMs = now.getTime() - checkInTime.getTime();
            const totalHours = durationMs / (1000 * 60 * 60);

            const { data, error } = await supabase
                .from("attendance_periods")
                .update({ check_out: now.toISOString(), total_hours: totalHours })
                .eq("id", openSession.id)
                .select()
                .single();

            result = { type: 'CHECK_OUT', data };
        } else {
            // Clock IN
            // Get site from device
            const { data: device } = await supabase
                .from("devices")
                .select("site_id")
                .eq("id", device_id)
                .single();

            const { data, error } = await supabase
                .from("attendance_periods")
                .insert({
                    user_id: creds.user_id,
                    site_id: device?.site_id,
                    check_in: now.toISOString(),
                })
                .select()
                .single();

            result = { type: 'CHECK_IN', data };
        }

        return NextResponse.json({ message: 'Success', ...result });
    } catch (error: any) {
        console.error("Gatekeeper Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}
