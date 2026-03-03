const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDemoUsers() {
    console.log("Signing up Admin User...");
    const { data: adminData, error: adminErr } = await supabase.auth.signUp({
        email: 'sa@gss-os.com',
        password: 'Password123!',
        options: {
            data: {
                role: 'super_admin',
                full_name: 'Nexus Super Admin'
            }
        }
    });
    if (adminErr) console.error("Admin error:", adminErr.message);
    else console.log("Admin signed up:", adminData.user?.id);

    console.log("Signing up Guard User...");
    const { data: guardData, error: guardErr } = await supabase.auth.signUp({
        email: 'gate@gss-os.com',
        password: 'Password123!',
        options: {
            data: {
                role: 'guard',
                full_name: 'Gate Guard'
            }
        }
    });
    if (guardErr) console.error("Guard error:", guardErr.message);
    else console.log("Guard signed up:", guardData.user?.id);

    console.log("Done signing up. Next run SQL to confirm.");
}

setupDemoUsers();
