'use client'

import { useState, useEffect } from 'react'
import { Server, Zap, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react'

export default function SuperAdminDashboard() {
    const [tunnelStatus, setTunnelStatus] = useState<'checking' | 'online' | 'offline'>('checking')
    const [sitesUsed, setSitesUsed] = useState(1485)
    const MAX_SITES = 2000

    const checkTunnelHealth = async () => {
        setTunnelStatus('checking')
        try {
            const res = await fetch('/api/health')
            const data = await res.json()
            if (data.status === 'connected') {
                setTunnelStatus('online')
            } else {
                setTunnelStatus('offline')
            }
        } catch (error) {
            console.error('Failed to probe tunnel health', error)
            setTunnelStatus('offline')
        }
    }

    useEffect(() => {
        let mounted = true

        const fetchHealth = async () => {
            try {
                const res = await fetch('/api/health')
                const data = await res.json()
                if (mounted) {
                    setTunnelStatus(data.status === 'connected' ? 'online' : 'offline')
                }
            } catch (error) {
                if (mounted) setTunnelStatus('offline')
            }
        }

        fetchHealth()

        // Simulate minor site usage fluctuations
        const interval = setInterval(() => {
            setSitesUsed(prev => Math.min(prev + Math.floor(Math.random() * 3) - 1, MAX_SITES))
        }, 10000)

        return () => {
            clearInterval(interval)
            clearInterval(interval)
        }
    }, [])

    const sitesPercentage = (sitesUsed / MAX_SITES) * 100
    const isNearingCapacity = sitesPercentage > 85

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8 text-destructive" />
                    System Health & Capacity
                </h1>
                <p className="text-muted-foreground mt-2">
                    Super Admin overview of Impro hardware connectivity and software limits.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {/* Tunnel Health Monitor */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Server className="h-5 w-5 text-primary" />
                            Tunnel Health Monitor
                        </h2>
                        <button
                            onClick={checkTunnelHealth}
                            disabled={tunnelStatus === 'checking'}
                            className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${tunnelStatus === 'checking' ? 'animate-spin text-primary' : ''}`} />
                        </button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Live connection status to the on-premise Impro i3 PC.
                    </p>

                    <div className="flex items-center gap-4 bg-background/50 p-4 rounded-xl border border-border/50">
                        <div className={`h-4 w-4 rounded-full ${tunnelStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
                            tunnelStatus === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' :
                                'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                            }`} />
                        <div className="flex-1">
                            <h3 className="font-semibold capitalize">{tunnelStatus === 'checking' ? 'Pinging Tunnel...' : tunnelStatus}</h3>
                            <p className="text-xs text-muted-foreground">
                                {tunnelStatus === 'online' ? 'API requests are routing securely to localhost.' :
                                    tunnelStatus === 'offline' ? 'Bridge offline. API pushes will be queued.' :
                                        'Verifying SSL/TLS handshake...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Site Capacity Tracker */}
                <div className="glass-card rounded-2xl p-6 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Site Capacity Tracker
                        </h2>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6">
                        Impro SLP935 software licensing limits monitoring.
                    </p>

                    <div className="bg-background/50 p-4 rounded-xl border border-border/50">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <span className={`text-3xl font-bold ${isNearingCapacity ? 'text-destructive' : 'text-foreground'}`}>
                                    {sitesUsed.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground"> / {MAX_SITES.toLocaleString()}</span>
                            </div>
                            <span className="text-sm font-medium">{Math.floor(sitesPercentage)}%</span>
                        </div>

                        <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${isNearingCapacity ? 'bg-destructive' : 'bg-primary'}`}
                                style={{ width: `${Math.min(sitesPercentage, 100)}%` }}
                            />
                        </div>

                        {isNearingCapacity && (
                            <div className="mt-4 flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>Warning: Impro specific capacity is over 85%. You may hit hard limits soon preventing new tags from syncing. Contact support to upgrade licensing.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
