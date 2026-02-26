import { createClient } from '@/lib/supabase/server'
import { CarFront, Clock, User, Hash } from 'lucide-react'

export default async function GuardParkingPage() {
    const supabase = await createClient()

    // Fetch visitors for today who requested parking
    const today = new Date().toISOString().split('T')[0]

    const { data: parkedVisitors } = await supabase
        .from('visitors')
        .select(`
            id,
            visitor_name,
            credential_number,
            status,
            units (name)
        `)
        .eq('needs_parking', true)
        .eq('access_date', today)

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <CarFront className="h-8 w-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                    Parking Roster
                </h1>
                <p className="text-muted-foreground mt-2">
                    Today&apos;s pre-approved underground parking requests ({today}).
                </p>
            </div>

            <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-card/50 border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium flex items-center gap-2"><User className="h-4 w-4" /> Guest Name</th>
                                <th className="px-6 py-4 font-medium"><Hash className="h-4 w-4 inline mr-1" /> Unit Destination</th>
                                <th className="px-6 py-4 font-medium">Cred Number</th>
                                <th className="px-6 py-4 font-medium text-right"><Clock className="h-4 w-4 inline mr-1" /> Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!parkedVisitors || parkedVisitors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2 opacity-50">
                                            <CarFront className="h-10 w-10 mb-2" />
                                            <p>No parking requests scheduled for today.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                parkedVisitors.map((v) => (
                                    <tr key={v.id} className="border-b border-border/50 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {v.visitor_name}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground font-mono">
                                            {Array.isArray(v.units) ? v.units[0]?.name : (v.units as unknown as { name?: string })?.name || 'Unknown Unit'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            {v.credential_number}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${v.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                v.status === 'revoked' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                                                    'bg-secondary text-muted-foreground'
                                                }`}>
                                                {v.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
