import { createClient } from '@supabase/supabase-js'

// WARNING: This client bypasses Row Level Security (RLS).
// It must NEVER be imported or used inside a Client Component.
// Only use this in Next.js Server Actions or Server Routes.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'

export const adminAuthClient = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)
