'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ScanLine, KeySquare, CarFront, AlertCircle, CheckCircle2, ShieldCheck, Loader2, Users } from 'lucide-react'
import { useEffect } from 'react'

type UnitData = { name?: string }
type VisitorAccessWindow = { access_date: string; start_time: string; end_time: string }

type ScanResult = {
    status: 'success' | 'error' | 'idle'
    message: string
    data?: { name: string; unit: string; parking: boolean; windows: VisitorAccessWindow[] }
}

type TodayVisitor = {
    id: string
    visitor_name: string
    pin_code: string
    status: string
    needs_parking?: boolean
    units: UnitData | UnitData[] | null
    visitor_access_windows: VisitorAccessWindow[] | null
}

export default function GuardDashboardPage() {
    const [scannedPin, setScannedPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [gateLoading, setGateLoading] = useState<'pedestrian' | 'vehicle' | null>(null)
    const [gateResult, setGateResult] = useState<string | null>(null)
    const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle', message: '' })
    const [todayVisitors, setTodayVisitors] = useState<TodayVisitor[]>([])
    const [visitorsLoading, setVisitorsLoading] = useState(true)

    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

    // Load today's visitors on mount
    useEffect(() => {
        const load = async () => {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('visitors')
                .select(`
                    id,
                    visitor_name,
                    pin_code,
                    status,
                    units (name),
                    visitor_access_windows (access_date, start_time, end_time)
                `)
                .eq('status', 'active')
                .filter('visitor_access_windows.access_date', 'eq', todayStr)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Failed to load guard dashboard visitors:', error)
                setTodayVisitors([])
            } else {
                setTodayVisitors((data as unknown as TodayVisitor[]) || [])
            }
            setVisitorsLoading(false)
        }
        load()
    }, [todayStr])

    const handleVerify = async () => {
        if (scannedPin.length < 5) return
        setLoading(true)
        setScanResult({ status: 'idle', message: '' })

        const supabase = createClient()

        // Look up visitor by PIN — must be active and have a window covering today
        const { data: rawVisitors, error } = await supabase
            .from('visitors')
            .select(`
                id,
                visitor_name,
                needs_parking,
                status,
                units (name),
                visitor_access_windows (access_date, start_time, end_time)
            `)
            .eq('pin_code', scannedPin)
            .eq('status', 'active')

        if (error) {
            console.error('Failed to verify PIN:', error)
            setScanResult({ status: 'error', message: 'Database error while verifying PIN.' })
            setLoading(false)
            return
        }

        const visitors = rawVisitors as unknown as TodayVisitor[]

        if (!visitors || visitors.length === 0) {
            setScanResult({ status: 'error', message: 'Invalid or expired PIN. No matching active visitor found.' })
            setLoading(false)
            return
        }

        const visitor = visitors[0]

        // Check if any of the visitor's windows covers today and current time
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5) // HH:MM
        const windows = visitor.visitor_access_windows || []
        const validWindow = windows.find(w =>
            w.access_date === todayStr &&
            w.start_time <= currentTime &&
            w.end_time >= currentTime
        )

        if (windows.length > 0 && !validWindow) {
            const todayWindow = windows.find(w => w.access_date === todayStr)
            if (todayWindow) {
                setScanResult({
                    status: 'error',
                    message: `Pass not valid at this time. Access window: ${todayWindow.start_time} – ${todayWindow.end_time}`
                })
            } else {
                setScanResult({ status: 'error', message: 'Pass not valid today. Check access schedule.' })
            }
            setLoading(false)
            return
        }

        const unitName = Array.isArray(visitor.units)
            ? visitor.units[0]?.name
            : visitor.units?.name

        setScanResult({
            status: 'success',
            message: `Valid credential — ${visitor.visitor_name} (${unitName || 'Unknown Unit'})`,
            data: {
                name: visitor.visitor_name,
                unit: unitName || 'Unknown Unit',
                parking: visitor.needs_parking || false,
                windows
            }
        })

        setLoading(false)
    }

    const openGate = async (type: 'pedestrian' | 'vehicle') => {
        setGateLoading(type)
        setGateResult(null)

        const externalUrl = process.env.NEXT_PUBLIC_BRIDGE_URL
        if (!externalUrl) {
            setGateResult(`Gate override sent (bridge URL not configured in this build).`)
            setGateLoading(null)
            return
        }

        try {
            const res = await fetch('/api/guard/gate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gate_type: type })
            })
            if (res.ok) {
                setGateResult(`✅ ${type === 'pedestrian' ? 'Pedestrian turnstile' : 'Vehicle boom gate'} opened.`)
            } else {
                setGateResult(`⚠️ Gate command sent but bridge returned error ${res.status}.`)
            }
        } catch {
            setGateResult(`❌ Could not reach hardware bridge.`)
        }

        setGateLoading(null)
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                    Access Control Hub
                </h1>
                <p className="text-muted-foreground mt-2">
                    Verify guest credentials and manage manual perimeter access.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* PIN / QR Verification */}
                <div className="glass-card rounded-2xl p-8 border border-border/50 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/40 animate-[scan_3s_ease-in-out_infinite]" />

                    <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(37,99,235,0.2)]">
                        <ScanLine className="h-12 w-12 text-primary" />
                    </div>

                    <h2 className="text-xl font-semibold mb-2">Scan QR or Enter PIN</h2>
                    <p className="text-sm text-muted-foreground text-center mb-8 max-w-[250px]">
                        Enter the visitor&apos;s 5-digit backup PIN to verify their credential.
                    </p>

                    <div className="w-full max-w-xs space-y-4">
                        <div className="relative">
                            <KeySquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                inputMode="numeric"
                                value={scannedPin}
                                onChange={(e) => setScannedPin(e.target.value.replace(/\D/g, '').slice(0, 5))}
                                placeholder="Enter 5-digit PIN"
                                maxLength={5}
                                className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl text-center text-lg tracking-[0.2em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            />
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={scannedPin.length < 5 || loading}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : 'Verify Credential'}
                        </button>
                    </div>

                    {scanResult.status !== 'idle' && (
                        <div className={`mt-6 w-full max-w-xs p-4 rounded-xl border flex items-start gap-3 ${scanResult.status === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                            {scanResult.status === 'success'
                                ? <CheckCircle2 className="h-5 w-5 shrink-0" />
                                : <AlertCircle className="h-5 w-5 shrink-0" />}
                            <div>
                                <h3 className="font-semibold text-sm">
                                    {scanResult.status === 'success' ? 'Access Granted' : 'Access Denied'}
                                </h3>
                                <p className="text-xs mt-1">{scanResult.message}</p>
                                {scanResult.data?.parking && (
                                    <p className="text-xs mt-1 font-semibold">🚗 Parking authorized</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual Controls & Roster */}
                <div className="space-y-6">
                    {/* Gate Controls */}
                    <div className="glass-card rounded-2xl p-6 border border-border/50">
                        <h2 className="text-lg font-semibold mb-4">Manual Gate Overrides</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => openGate('pedestrian')}
                                disabled={gateLoading === 'pedestrian'}
                                className="flex flex-col items-center justify-center p-6 border border-border/50 rounded-xl bg-card/50 hover:bg-secondary transition-colors group disabled:opacity-60"
                            >
                                {gateLoading === 'pedestrian'
                                    ? <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                    : <ScanLine className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />}
                                <span className="text-sm font-medium">Pedestrian Turnstile</span>
                            </button>
                            <button
                                onClick={() => openGate('vehicle')}
                                disabled={gateLoading === 'vehicle'}
                                className="flex flex-col items-center justify-center p-6 border border-border/50 rounded-xl bg-card/50 hover:bg-secondary transition-colors group disabled:opacity-60"
                            >
                                {gateLoading === 'vehicle'
                                    ? <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                    : <CarFront className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />}
                                <span className="text-sm font-medium">Vehicle Boom Gate</span>
                            </button>
                        </div>
                        {gateResult && (
                            <p className="mt-3 text-xs text-center text-muted-foreground">{gateResult}</p>
                        )}
                    </div>

                    {/* Today's Expected Visitors — LIVE */}
                    <div className="glass-card rounded-2xl p-6 border border-border/50 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Today&apos;s Visitors
                            </h2>
                            <span className="text-xs text-muted-foreground">{todayStr}</span>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-52">
                            {visitorsLoading ? (
                                <div className="flex items-center justify-center py-6 text-muted-foreground">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                                </div>
                            ) : todayVisitors.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-6">No visitors expected today.</p>
                            ) : (
                                todayVisitors.map((v) => {
                                    const window = v.visitor_access_windows?.find(w => w.access_date === todayStr)
                                    const unitName = Array.isArray(v.units)
                                        ? (v.units[0] as { name?: string })?.name
                                        : (v.units as { name?: string } | null)?.name

                                    return (
                                        <div key={v.id} className="bg-background/50 rounded-xl p-3 border border-border flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-sm text-foreground">{v.visitor_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {unitName || 'Unknown Unit'}
                                                    {window ? ` · ${window.start_time}–${window.end_time}` : ''}
                                                </div>
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wider">
                                                Expected
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive/80 mt-8 max-w-2xl mx-auto">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-destructive">Strict Anti-Passback Enforced</p>
                    <p className="mt-1">Credentials are single-use per directional scan. Screenshots passed to outside guests will be rejected at the turnstile automatically by the Impro logic controller.</p>
                </div>
            </div>
        </div>
    )
}
