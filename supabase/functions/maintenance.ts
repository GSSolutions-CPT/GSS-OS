import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenancePayload {
    site_id: string;
    technician_id: string;
    equipment_type: "cctv" | "access_control" | "intercom" | "alarm";
    system_status: "operational" | "degraded" | "offline";
    tasks_completed: string[];
    photo_url: string;
    gps: Record<string, unknown>;
    notes?: string;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const payload = await req.json() as MaintenancePayload;
        const {
            site_id,
            technician_id,
            equipment_type,
            system_status,
            tasks_completed,
            photo_url,
            gps,
            notes
        } = payload;

        const evaluatedStatus = system_status === "operational" ? "MAINTAINED" : "SERVICE_REQUIRED";

        const { data, error } = await supabase
            .from("maintenance_contracts")
            .insert({
                site_id,
                technician_id,
                equipment_type,
                system_status,
                tasks_completed,
                photo_url,
                gps,
                notes
            })
            .select()
            .single();

        if (error) throw error;

        return new Response(
            JSON.stringify({ message: "Maintenance Contract Logged", status: evaluatedStatus, data }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: unknown) {
        const errorMessage = error instanceof Error
            ? error.message
            : "An unknown error occurred during log submission";

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
