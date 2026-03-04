import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { GuestAdBanner } from '@/components/GuestAdBanner'
import { Wifi, Clock, ShieldAlert, KeySquare, CalendarDays, CheckCircle2 } from 'lucide-react'

type AccessWindow = {
    access_date: string
    start_time: string
    end_time: string
}

type UnitData = { name?: string; type?: string }

interface GuestVisitor {
    id: string
    visitor_name: string
    credential_number: number
    pin_code: string
    status: string
    units: UnitData | UnitData[] | null
    visitor_access_windows: AccessWindow[] | null
}

export default async function GuestPassPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()

    const { id } = await params

    const { data: rawVisitor, error: visitorError } = await supabase
        .from('visitors')
        .select(`
            id, visitor_name, credential_number, pin_code, status,
            units (name, type),
            visitor_access_windows (
                access_date, start_time, end_time
            )
        `)
        .eq('id', id)
        .single()

    if (visitorError) {
        console.error('Failed to fetch guest visitor data:', visitorError)
        notFound()
    }

    if (!rawVisitor) notFound()

    const visitor = rawVisitor as unknown as GuestVisitor

    const { data: settings, error: settingsError } = await supabase
        .from('building_settings')
        .select('house_rules, wifi_ssid, wifi_password, check_in_time, check_out_time')
        .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Database connection dropped checking building properties', settingsError)
    }

    const defaultSettings = {
        house_rules: '1. No noise after 10PM.\n2. No littering in common areas.\n3. Residents responsible for guest behaviour.',
        wifi_ssid: '35OnRose_Guest_WiFi',
        wifi_password: 'rose-security-gss',
        check_in_time: '14:00',
        check_out_time: '10:00'
    }

    const activeSettings = settings || defaultSettings
    const isRevoked = visitor.status === 'revoked'

    const unitName = Array.isArray(visitor.units)
        ? visitor.units[0]?.name
        : visitor.units?.name

    // Get sorted access windows
    const rawWindows = visitor.visitor_access_windows
    const accessWindows: AccessWindow[] = rawWindows
        ? [...rawWindows].sort((a, b) => a.access_date.localeCompare(b.access_date))
        : []

    // Determine today's date string for highlighting
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

    // Build header subtitle
    const headerSubtitle = (() => {
        if (accessWindows.length === 0) {
            return `Valid for ${unitName}`
        }
        if (accessWindows.length === 1) {
            const w = accessWindows[0]
            const date = new Date(w.access_date + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
            return `Valid for ${unitName} · ${date}`
        }
        const first = new Date(accessWindows[0].access_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        const last = new Date(accessWindows[accessWindows.length - 1].access_date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        return `${accessWindows.length} days access for ${unitName} · ${first} – ${last}`
    })()

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 pb-12 sm:p-8">
            <div className="w-full max-w-md space-y-6">

                {/* Header Info */}
                <div className="text-center space-y-2 mt-4">
                    <h1 className="text-2xl font-bold text-foreground">Welcome, {visitor.visitor_name}</h1>
                    <p className="text-muted-foreground text-sm">{headerSubtitle}</p>
                </div>

                {/* Main Pass Card */}
                <div className="glass-card rounded-3xl p-6 border border-border/50 shadow-2xl relative overflow-hidden flex flex-col items-center">
                    {isRevoked && (
                        <div className="absolute inset-0 z-20 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
                            <h2 className="text-2xl font-bold text-destructive">Pass Revoked</h2>
                            <p className="text-sm font-medium text-foreground mt-2">This credential is no longer valid.</p>
                        </div>
                    )}

                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

                    <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">Digital Credential</h2>

                    <div className="bg-white p-4 rounded-2xl shadow-inner mb-6">
                        <QRCodeDisplay value={visitor.credential_number.toString()} size={200} />
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-[250px] mb-6">
                        Hold this QR code steady under the scanner at the pedestrian turnstile or vehicle boom.
                    </p>

                    <div className="w-full bg-secondary/50 rounded-xl p-4 border border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <KeySquare className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Backup PIN</p>
                                <p className="font-mono font-bold tracking-widest text-lg">{visitor.pin_code || '12345'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ad Widget */}
                <GuestAdBanner />

                {/* Digital Guidebook */}
                <div className="glass-card rounded-2xl p-6 border border-border/50 space-y-6">
                    <h3 className="font-semibold text-lg border-b border-border/50 pb-3">Digital Guidebook</h3>

                    <div className="space-y-5">
                        {/* Access Schedule – dynamic per window */}
                        <div className="flex gap-4 items-start">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <CalendarDays className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-foreground mb-2">Access Schedule</h4>
                                {accessWindows.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Check-in from <strong>{activeSettings.check_in_time}</strong>.{' '}
                                        Check-out by <strong>{activeSettings.check_out_time}</strong>.
                                    </p>
                                ) : (
                                    <div className="space-y-1.5">
                                        {accessWindows.map((w, i) => {
                                            const isToday = w.access_date === todayStr
                                            const dateLabel = new Date(w.access_date + 'T00:00').toLocaleDateString(undefined, {
                                                weekday: 'short', month: 'short', day: 'numeric'
                                            })
                                            return (
                                                <div
                                                    key={i}
                                                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${isToday
                                                        ? 'bg-primary/15 border border-primary/30 text-foreground'
                                                        : 'bg-secondary/30 text-muted-foreground'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isToday && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                                                        <span className={`font-semibold ${isToday ? 'text-primary' : ''}`}>
                                                            {dateLabel}{isToday ? ' · Today' : ''}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono">{w.start_time} – {w.end_time}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Wi-Fi */}
                        <div className="flex gap-4 items-start">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <Wifi className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Guest Wi-Fi</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Network: <strong>{activeSettings.wifi_ssid}</strong><br />
                                    Password: <strong>{activeSettings.wifi_password}</strong>
                                </p>
                            </div>
                        </div>

                        {/* House Rules */}
                        <div className="flex gap-4 items-start">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">House Rules</h4>
                                <div className="text-xs text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">
                                    {activeSettings.house_rules}
                                </div>
                            </div>
                        </div>

                        {/* Legacy fallback if no windows */}
                        {accessWindows.length === 0 && (
                            <div className="flex gap-4 items-start">
                                <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-foreground">Building Hours</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Night access requires guard physical validation.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
