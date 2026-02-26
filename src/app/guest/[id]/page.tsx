import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'
import { GuestAdBanner } from '@/components/GuestAdBanner'
import { Wifi, Clock, ShieldAlert, KeySquare } from 'lucide-react'

export default async function GuestPassPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()

    const { id } = await params

    const { data: visitor } = await supabase
        .from('visitors')
        .select(`
            *,
            units (name, type)
        `)
        .eq('id', id)
        .single()

    if (!visitor) {
        notFound()
    }

    const isRevoked = visitor.status === 'revoked'
    const unitName = Array.isArray(visitor.units) ? visitor.units[0]?.name : (visitor.units as unknown as { name?: string })?.name || 'Unknown Unit'

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start p-4 pb-12 sm:p-8">
            <div className="w-full max-w-md space-y-6">

                {/* Header Info */}
                <div className="text-center space-y-2 mt-4">
                    <h1 className="text-2xl font-bold text-foreground">Welcome, {visitor.visitor_name}</h1>
                    <p className="text-muted-foreground text-sm">Valid for {unitName} on {new Date(visitor.access_date).toLocaleDateString()}</p>
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

                    <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <Clock className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Access Hours</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    This pass is valid for entry between 06:00 and 22:00 on the selected date. Night access requires guard physical validation.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <Wifi className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">Guest Wi-Fi</h4>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    Network: <strong>GSS-Guest</strong><br />
                                    Password: <strong>Welcome!2025</strong>
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-start">
                            <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">House Rules</h4>
                                <ul className="text-xs text-muted-foreground mt-1 leading-relaxed list-disc pl-4 space-y-1">
                                    <li>Speed limit in basement is 15km/h.</li>
                                    <li>No unauthorized access to commercial floors.</li>
                                    <li>Present this pass to security if requested.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
