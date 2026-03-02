'use client'

import { useState } from 'react'
import { login } from './actions'
import { Loader2, Shield, Lock, Eye, EyeOff, QrCode, Wifi, Activity } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        const res = await login(formData)
        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex bg-background overflow-hidden relative">

            {/* ── Ambient background orbs ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-5%] w-[55%] h-[55%] bg-primary/15 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[140px]" />
                <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px]" />
            </div>

            {/* ── Left branding panel (hidden on mobile) ── */}
            <div className="hidden lg:flex flex-col justify-between w-[55%] p-12 relative z-10">

                {/* Brand mark */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-sm">
                        <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground/70 tracking-widest uppercase">Nexus by GSS</span>
                </div>

                {/* Centre headline */}
                <div className="max-w-lg">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-6">
                        <Activity className="h-3 w-3" />
                        Live Security Operations
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight mb-5">
                        Intelligent<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                            Access Control
                        </span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Manage visitor credentials, monitor entry points, and control perimeter access — all from one secure portal.
                    </p>
                </div>

                {/* Floating stat cards */}
                <div className="flex gap-4">
                    {[
                        { icon: QrCode, label: 'Mobile & QR Code Auth', value: 'Active' },
                        { icon: Wifi, label: 'Bridge Status', value: 'Online' },
                        { icon: Shield, label: 'RLS Policies', value: 'Enforced' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="flex-1 glass-card rounded-2xl p-4 border border-border/40">
                            <Icon className="h-5 w-5 text-primary mb-3" />
                            <div className="text-xs text-muted-foreground">{label}</div>
                            <div className="text-sm font-semibold text-green-400 mt-0.5">{value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                <main className="w-full max-w-sm">

                    {/* Card */}
                    <div className="glass-card rounded-3xl p-8 border border-border/50 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">

                        {/* Logo */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative mb-5">
                                <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl scale-110" />
                                <div className="relative w-20 h-20 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                                    <Image
                                        src="/icon-512x512.svg"
                                        alt="NEXUS by GSS"
                                        width={52}
                                        height={52}
                                        className="object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                            <p className="text-sm text-muted-foreground mt-1">Sign in to your secure workspace</p>
                        </div>

                        {/* Form */}
                        <form action={handleSubmit} className="space-y-4">

                            {error && (
                                <div className="p-3 text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-center animate-pulse">
                                    {error}
                                </div>
                            )}

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1" htmlFor="email">
                                    Email address
                                </label>
                                <div className="relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className="w-full bg-input/60 border border-border/70 rounded-xl px-4 py-3.5 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground tracking-wider uppercase pl-1" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        className="w-full bg-input/60 border border-border/70 rounded-xl px-4 py-3.5 pr-11 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/50 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 py-3.5 rounded-xl font-semibold text-sm tracking-wide
                                    bg-gradient-to-r from-primary to-cyan-500
                                    hover:from-primary/90 hover:to-cyan-400
                                    text-primary-foreground
                                    shadow-[0_4px_20px_rgba(37,99,235,0.4)]
                                    hover:shadow-[0_4px_28px_rgba(37,99,235,0.55)]
                                    disabled:opacity-60 disabled:cursor-not-allowed
                                    transition-all duration-200
                                    flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
                                ) : (
                                    <><Lock className="h-4 w-4" /> Authenticate securely</>
                                )}
                            </button>
                        </form>

                        {/* Security notice */}
                        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
                            <Shield className="h-3 w-3" />
                            <span>256-bit encrypted · Row-level security enforced</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="mt-6 text-center text-xs text-muted-foreground/50">
                        &copy; {new Date().getFullYear()} Nexus Access Systems Inc.
                    </p>
                </main>
            </div>
        </div>
    )
}
