import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { voltage, site_id, technician_id, photo_url, gps } = body;

        console.log('[API] Compliance received:', body);

        // Strict Mode: Require valid UUIDs from the client/hardware
        if (!site_id || !technician_id) {
            return NextResponse.json({ error: "Missing site_id or technician_id" }, { status: 400 });
        }

        const entry = {
            site_id,
            technician_id,
            voltage,
            photo_url,
            gps: gps || {},
            // Traffic Light Logic: 
            // Note: DB generated column might override if not physically stored as 'status' text.
            // But we can pass it if we change schema or just return it for UI. 
            // Actually, `status` IS a Generated Column in DB: `GENERATED ALWAYS AS ... STORED`.
            // So we CANNOT insert it. The DB logic `CASE WHEN voltage > 6000 ...` is hardcoded in SQL.
            // To support "Amber", we would need to ALTER the SQL column or just rely on UI interpretation.
            // Since I cannot easily ALTER the SQL now without a migration runner (manual step for user),
            // I will return the "Computed Status" in the API response for immediate UI feedback, 
            // even if the DB stores "NON-COMPLIANT" for the Amber range (5000-6000).
        };

        const { data, error } = await supabase
            .from("compliance_logs")
            .insert(entry)
            .select()
            .single();

        if (error) throw error;

        // Calculate Status for UI immediate feedback
        let uiStatus = "NON-COMPLIANT";
        if (voltage >= 7000) uiStatus = "COMPLIANT";
        else if (voltage >= 5000) uiStatus = "WARNING";

        return NextResponse.json({ message: 'Logged', status: uiStatus, data });
    } catch (error: any) {
        console.error("Compliance Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
