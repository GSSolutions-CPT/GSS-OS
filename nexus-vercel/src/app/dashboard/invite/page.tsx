'use client'

import { useState } from 'react'
import { inviteVisitor } from './actions'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function InvitePage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setError(null)
        const res = await inviteVisitor(formData)

        if (res?.error) {
            setError(res.error)
            setIsLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Link
                href="/dashboard"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
            </Link>

            <div className="glass-card rounded-2xl p-8 border border-border/50 relative overflow-hidden">
                {/* Glow effect inside form */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Invite Visitor</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Generate an instant secure credential for your incoming guest.
                    </p>
                </div>

                <form action={handleSubmit} className="space-y-6 relative z-10 w-full">
                    {error && (
                        <div className="p-4 text-sm rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground/90" htmlFor="name">
                            Visitor Full Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            className="w-full bg-input/40 border border-border/80 rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/90" htmlFor="email">
                                Email Address <span className="text-muted-foreground font-normal">(Optional)</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john.doe@example.com"
                                className="w-full bg-input/40 border border-border/80 rounded-xl px-4 py-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-foreground/90" htmlFor="date">
                                Access Date <span className="text-destructive">*</span>
                            </label>
                            <input
                                id="date"
                                name="date"
                                type="date"
                                required
                                className="w-full bg-input/40 border border-border/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground [color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border/40">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(250,204,21,0.3)] hover:shadow-[0_6px_20px_rgba(250,204,21,0.4)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center float-right"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Credential & Invite'
                            )}
                        </button>
                        <div className="clear-both" />
                    </div>
                </form>
            </div>
        </div>
    )
}
