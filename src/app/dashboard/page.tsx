import { createClient } from '@/lib/supabase/server'
import { PlusCircle, Search, Car, CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { RevokeButton } from './RevokeButton'
import { ResendButton } from './ResendButton'
import { redirect } from 'next/navigation'

type AccessWindow = {
    id: string
    access_date: string
    start_time: string
    end_time: string
}

interface Visitor {
    id: string
    visitor_name: string
    visitor_email: string
    status: string
    pin_code: string | null
    needs_parking: boolean
    credential_number: number
    visitor_access_windows: AccessWindow[]
}

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Redirect if no active user session
    if (!user) {
        redirect('/login')
    }

    // Fetch visitors with their access windows, explicitly filtered by host_id
    const { data: visitorsData, error: visitorsError } = await supabase
        .from('visitors')
        .select(`
            *,
            visitor_access_windows (
                id, access_date, start_time, end_time
            )
        `)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false })

    if (visitorsError) {
        console.error('Failed to fetch visitors data:', visitorsError)
    }

    const visitors = visitorsData as Visitor[] | null

    function formatAccessPeriod(windows: AccessWindow[] | undefined | null): string {
        if (!windows || windows.length === 0) return 'N/A'

        const sorted = [...windows].sort((a, b) => a.access_date.localeCompare(b.access_date))
        const format = (d: string) => new Date(d + 'T00:00').toLocaleDateString(undefined, {
            month: 'short', day: 'numeric'
        })

        if (sorted.length === 1) {
            const w = sorted[0]
            return `${format(w.access_date)} · ${w.start_time}–${w.end_time}`
        }

        return `${format(sorted[0].access_date)} – ${format(sorted[sorted.length - 1].access_date)} (${sorted.length} days)`
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Visitors</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your incoming guests and active credentials.
                    </p>
                </div>
                <Link
                    href="/dashboard/invite"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(56,189,248,0.2)]"
                >
                    <PlusCircle className="h-4 w-4" />
                    Invite Visitor
                </Link>
            </div>

            <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search visitors..."
                            className="w-full pl-9 pr-4 py-2 bg-input/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-muted-foreground">
                        <thead className="text-xs text-muted-foreground uppercase bg-card/50 border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Visitor Name</th>
                                <th className="px-6 py-4 font-medium">Access Period</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium text-right">Pass</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitorsError ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-destructive">
                                        Failed to load visitors. Please try again later.
                                    </td>
                                </tr>
                            ) : !visitors || visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No visitors found. Click &apos;Invite Visitor&apos; to add one.
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((visitor) => (
                                    <tr key={visitor.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {visitor.visitor_name}
                                            <div className="text-xs text-muted-foreground font-normal mt-0.5">{visitor.visitor_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <CalendarDays className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                <div className="flex flex-col gap-1">
                                                    <div className="font-medium text-foreground text-sm">
                                                        {formatAccessPeriod(visitor.visitor_access_windows)}
                                                    </div>
                                                    {visitor.visitor_access_windows?.length > 1 && (
                                                        <div className="text-xs text-muted-foreground mt-0.5 space-y-0.5 bg-black/10 rounded-md p-2">
                                                            {visitor.visitor_access_windows
                                                                .slice()
                                                                .sort((a, b) => a.access_date.localeCompare(b.access_date))
                                                                .map((w) => (
                                                                    <div key={w.id} className="flex justify-between w-48">
                                                                        <span>{new Date(w.access_date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}:</span>
                                                                        <span className="font-mono text-foreground">{w.start_time} - {w.end_time}</span>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${visitor.status === 'active' ? 'bg-green-500/10 text-green-500' :
                                                    visitor.status === 'revoked' ? 'bg-destructive/10 text-destructive' :
                                                        'bg-secondary text-muted-foreground'
                                                    }`}>
                                                    {visitor.status}
                                                </span>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                                                    PIN: <span className="text-foreground">{visitor.pin_code || 'N/A'}</span>
                                                </div>
                                                {visitor.needs_parking && (
                                                    <div className="text-xs text-primary flex items-center gap-1">
                                                        <Car className="h-3 w-3" /> Parking Req
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 flex items-center justify-end gap-4">
                                            {visitor.status === 'active' && (
                                                <div className="flex flex-col gap-2 items-end">
                                                    <ResendButton visitorId={visitor.id} />
                                                    <RevokeButton visitorId={visitor.id} />
                                                </div>
                                            )}
                                            <div className={visitor.status !== 'active' ? 'opacity-30 grayscale pointer-events-none' : ''}>
                                                <QRCodeDisplay value={visitor.credential_number.toString()} size={40} />
                                            </div>
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
