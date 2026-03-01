import { createClient } from '@/lib/supabase/server'
import { PhoneCall } from 'lucide-react'
import DirectoryList from './DirectoryList'

export default async function GuardDirectoryPage() {
    const supabase = await createClient()

    // Fetch all profiles (Group Admins/Residents) with their units
    const { data: profiles } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            role,
            units (name, type)
        `)
        .eq('role', 'group_admin')
        .order('full_name')

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <PhoneCall className="h-8 w-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                    Resident Directory
                </h1>
                <p className="text-muted-foreground mt-2">
                    Quick-call intercom contacts for unexpected deliveries and unannounced guests.
                </p>
            </div>

            <DirectoryList initialProfiles={profiles || []} />
        </div>
    )
}
