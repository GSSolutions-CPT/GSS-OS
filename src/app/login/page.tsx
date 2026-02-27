'use client'

import { useState } from 'react'
import { login } from './actions'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        const res = await login(formData)

        // Server action redirect throws to interrupt execution if success,
        // so if we get here, it returned an error object.
        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Decorative background blurs using new theme colors */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <main className="w-full max-w-md">
                <div className="glass-card rounded-2xl p-8 relative flex flex-col items-center border-border/50">

                    <div className="h-20 w-auto flex items-center justify-center mb-6 drop-shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                        <Image src="/logo.svg" alt="Global Security Solutions" width={180} height={60} className="object-contain" priority />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Nexus Vercel</h1>
                        <p className="text-sm text-muted-foreground">Secure Access Portal</p>
                    </div>

                    <form action={handleSubmit} className="w-full space-y-4">
                        {error && (
                            <div className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80 pl-1" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="owner@nexus.vercel.app"
                                className="w-full bg-input/50 border border-border rounded-xl px-4 py-3 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground/80 pl-1" htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-input/50 border border-border rounded-xl px-4 py-3 placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(56,189,248,0.39)] hover:shadow-[0_6px_20px_rgba(56,189,248,0.23)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Authenticate securely'}
                        </button>
                    </form>

                </div>

                <div className="mt-8 text-center text-xs text-muted-foreground">
                    &copy; {new Date().getFullYear()} Nexus Access Systems Inc.
                </div>
            </main>
        </div>
    )
}
