import { ShieldAlert, WifiOff } from 'lucide-react'

export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 bg-slate-950 text-slate-50">
            <div className="max-w-md w-full glass-card rounded-3xl p-8 border border-border/50 text-center shadow-2xl space-y-6">
                <div className="mx-auto w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full bg-destructive/20 blur-xl animate-pulse" />
                    <ShieldAlert className="h-10 w-10 text-destructive relative z-10" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center justify-center gap-2">
                        <WifiOff className="h-5 w-5 text-muted-foreground" />
                        No Connection
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        No Network Connection. Please check your signal to continue using Nexus.
                    </p>
                </div>

                <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground/60 flex items-center justify-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    System Offline
                </div>
            </div>
        </div>
    )
}
