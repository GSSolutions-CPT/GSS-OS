import { createClient } from '@supabase/supabase-js'

// WARNING: This client bypasses Row Level Security (RLS).
// It must NEVER be imported or used inside a Client Component.
// Only use this in Next.js Server Actions or Server Routes.
export const adminAuthClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
