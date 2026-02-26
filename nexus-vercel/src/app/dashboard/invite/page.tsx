'use client'

import { useState } from 'react'
import { inviteVisitor } from './actions'
import { Loader2, ArrowLeft, Upload, Users, Car } from 'lucide-react'
import Link from 'next/link'

export default function InvitePage() {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [mode, setMode] = useState<'single' | 'bulk'>('single')

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

                <div className="mb-6 flex items-center justify-between border-b border-border/50 pb-4 relative z-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Invite Visitor</h1>
                        <p className="text-muted-foreground mt-2 text-sm">
                            Generate secure credentials for your incoming guests.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 relative z-10 p-1 bg-input/20 border border-border/50 rounded-xl w-fit">
                    <button
                        onClick={() => setMode('single')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'single' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Single Invite
                    </button>
                    <button
                        onClick={() => setMode('bulk')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${mode === 'bulk' ? 'bg-background shadow-md text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Users className="h-4 w-4" /> Bulk Upload (CSV)
                    </button>
                </div>

                {mode === 'single' ? (
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

                        <div className="mb-4">
                            <label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background/80 cursor-pointer transition-colors group">
                                <input type="checkbox" name="needs_parking" className="w-5 h-5 rounded border-border text-primary focus:ring-primary bg-input" />
                                <div>
                                    <div className="font-semibold text-foreground flex items-center gap-2">
                                        <Car className="h-4 w-4 text-primary" /> Request Visitor Parking
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug mt-1">If approved, Guard Dashboard will authorize underground parking boom gate lift.</p>
                                </div>
                            </label>
                        </div>

                        <div className="pt-4 border-t border-border/40 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full sm:w-auto px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(250,204,21,0.3)] hover:shadow-[0_6px_20px_rgba(250,204,21,0.4)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
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
                        </div>
                    </form>
                ) : (
                    <div className="relative z-10 w-full space-y-6">
                        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:bg-secondary/20 transition-colors cursor-pointer group">
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4 group-hover:text-primary transition-colors" />
                            <h3 className="font-semibold text-lg text-foreground">Click to upload CSV</h3>
                            <p className="text-sm text-muted-foreground mt-2">Upload a CSV containing Name, Email, and Access Date columns to bulk generate up to 50 credentials at once.</p>
                            <input type="file" accept=".csv" className="hidden" />
                        </div>
                        <div className="flex justify-end pt-4 border-t border-border/40">
                            <button className="btn-secondary px-8 font-semibold">Download CSV Template</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
