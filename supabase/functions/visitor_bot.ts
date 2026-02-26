import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { guest_name, expires_in_minutes } = await req.json();

        // Generate JWT
        // In a real app, use a secure key from env. Here we mock it.
        const key = await crypto.subtle.generateKey(
            { name: "HMAC", hash: "SHA-512" },
            true,
            ["sign", "verify"],
        );

        const validUntil = new Date(Date.now() + expires_in_minutes * 60000);

        // Create the payload
        const payload = {
            sub: guest_name,
            exp: djwt.getNumericDate(validUntil),
            type: "visitor_access",
        };

        const jwt = await djwt.create({ alg: "HS512", typ: "JWT" }, payload, key);

        // Create a mock "WhatsApp Link" with the code
        const whatsAppLink = `https://wa.me/?text=Here+is+your+access+code:+${jwt}`;

        return new Response(JSON.stringify({
            qr_string: jwt,
            whatsapp_link: whatsAppLink,
            expires_at: validUntil
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
