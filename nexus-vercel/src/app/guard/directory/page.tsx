import { createClient } from '@/lib/supabase/server'
import { PhoneCall, Search, Hash, Building2 } from 'lucide-react'

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

    // Normally we would have phone numbers in the profiles table, 
    // but we'll mock them here for demonstration purposes if missing,
    // or just show a "Call" button that links to a hypothetical internal intercom

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

            <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search residents or units..."
                            className="w-full pl-9 pr-4 py-2 bg-input/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-card/50 border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium"><Hash className="h-4 w-4 inline mr-1" /> Unit</th>
                                <th className="px-6 py-4 font-medium"><Building2 className="h-4 w-4 inline mr-1" /> Type</th>
                                <th className="px-6 py-4 font-medium">Contact Name</th>
                                <th className="px-6 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!profiles || profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        No contacts found.
                                    </td>
                                </tr>
                            ) : (
                                profiles.map((p) => {
                                    const unitName = Array.isArray(p.units) ? p.units[0]?.name : (p.units as unknown as { name?: string })?.name || 'Unknown Unit'
                                    const unitType = Array.isArray(p.units) ? p.units[0]?.type : (p.units as unknown as { type?: string })?.type || 'residential'

                                    return (
                                        <tr key={p.id} className="border-b border-border/50 hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-medium text-foreground">
                                                {unitName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${unitType === 'business' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                                                    }`}>
                                                    {unitType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">
                                                <div className="font-medium text-foreground">{p.full_name || 'Unassigned'}</div>
                                                <div className="text-xs">Primary Admin</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]">
                                                    <PhoneCall className="h-4 w-4 mr-2" />
                                                    Call Unit
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
