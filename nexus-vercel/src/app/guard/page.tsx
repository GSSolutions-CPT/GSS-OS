'use client'

import { useState } from 'react'
import { ScanLine, KeySquare, CarFront, AlertCircle, Search, ShieldCheck } from 'lucide-react'

type ScanResult = { status: 'success' | 'error' | 'idle', message: string, data?: { name: string, unit: string, parking: boolean } }

export default function GuardDashboardPage() {
    const [scannedPin, setScannedPin] = useState('')
    const [loading, setLoading] = useState(false)
    const [scanResult, setScanResult] = useState<ScanResult>({ status: 'idle', message: '' })

    const handleSimulateScan = () => {
        setLoading(true)
        setScanResult({ status: 'idle', message: '' })
        setTimeout(() => {
            if (scannedPin === '12345') {
                setScanResult({
                    status: 'success',
                    message: 'Valid Pass: John Doe (Unit 42A)',
                    data: { name: 'John Doe', unit: 'Unit 42A', parking: true }
                })
            } else {
                setScanResult({
                    status: 'error',
                    message: 'Invalid or Expired Pass'
                })
            }
            setLoading(false)
        }, 800)
    }

    const openGate = (type: 'pedestrian' | 'vehicle') => {
        alert(`Manually opened ${type} gate/boom.`)
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
                {/* Scanner Interface */}
                <div className="glass-card rounded-2xl p-8 border border-border/50 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    {/* Animated scanning line bg */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/40 bx-shadow-[0_0_20px_rgba(37,99,235,1)] animate-[scan_3s_ease-in-out_infinite]" />

                    <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(37,99,235,0.2)]">
                        <ScanLine className="h-12 w-12 text-primary" />
                    </div>

                    <h2 className="text-xl font-semibold mb-2">Scan QR or Enter PIN</h2>
                    <p className="text-sm text-muted-foreground text-center mb-8 max-w-[250px]">
                        Awaiting input from physical scanner or manual PIN entry below.
                    </p>

                    <div className="w-full max-w-xs space-y-4">
                        <div className="relative">
                            <KeySquare className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                value={scannedPin}
                                onChange={(e) => setScannedPin(e.target.value)}
                                placeholder="Enter 5-digit PIN"
                                maxLength={5}
                                className="w-full pl-10 pr-4 py-3 bg-input/50 border border-border rounded-xl text-center text-lg tracking-[0.2em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                        <button
                            onClick={handleSimulateScan}
                            disabled={scannedPin.length < 5 || loading}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify Credential'}
                        </button>
                    </div>

                    {scanResult.status !== 'idle' && (
                        <div className={`mt-6 w-full max-w-xs p-4 rounded-xl border flex items-start gap-3 ${scanResult.status === 'success'
                            ? 'bg-green-500/10 border-green-500/20 text-green-500'
                            : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div>
                                <h3 className="font-semibold text-sm">{scanResult.status === 'success' ? 'Access Granted' : 'Access Denied'}</h3>
                                <p className="text-xs mt-1">{scanResult.message}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Manual Controls & Roster Summary */}
                <div className="space-y-6">
                    <div className="glass-card rounded-2xl p-6 border border-border/50">
                        <h2 className="text-lg font-semibold mb-4">Manual Gate Overrides</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => openGate('pedestrian')} className="flex flex-col items-center justify-center p-6 border border-border/50 rounded-xl bg-card/50 hover:bg-secondary transition-colors group">
                                <ScanLine className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium">Pedestrian Turnstile</span>
                            </button>
                            <button onClick={() => openGate('vehicle')} className="flex flex-col items-center justify-center p-6 border border-border/50 rounded-xl bg-card/50 hover:bg-secondary transition-colors group">
                                <CarFront className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium">Vehicle Boom Gate</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-card rounded-2xl p-6 border border-border/50 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Today&apos;s Expected Visitors</h2>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                            {/* Mock Data */}
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-background/50 rounded-xl p-3 border border-border flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-sm text-foreground">Guest Name {i}</div>
                                        <div className="text-xs text-muted-foreground">Unit {300 + i} • 14:00</div>
                                    </div>
                                    <div className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wider">
                                        Expected
                                    </div>
                                </div>
                            ))}
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
