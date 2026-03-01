'use client'

import { useState } from 'react'
import { KeySquare, SmartphoneNfc, CheckCircle2 } from 'lucide-react'
import { submitStidRequest } from './actions'

export default function StidRequestForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setIsSubmitting(true)
        setError(null)
        try {
            await submitStidRequest(formData)
            setIsSuccess(true)
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to submit request')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="glass-card rounded-2xl p-8 border border-green-500/30 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold">Request Submitted Successfully</h3>
                <p className="text-muted-foreground">
                    The Super Admin has been notified and will process the STid credential generation. The requested user will receive an email with their mobile ID link once completed.
                </p>
                <button
                    onClick={() => setIsSuccess(false)}
                    className="mt-6 btn-primary w-full sm:w-auto"
                >
                    Submit Another Request
                </button>
            </div>
        )
    }

    return (
        <form action={handleSubmit} className="glass-card rounded-2xl p-6 border border-border/50 space-y-6">
            <div className="space-y-4">
                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Resident / Staff Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        className="input-field"
                        placeholder="John Doe"
                    />
                </div>

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email (For STid Mobile ID App link)</label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        required
                        className="input-field"
                        placeholder="user@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Phone Number (Optional)</label>
                    <input
                        type="tel"
                        name="phone"
                        id="phone"
                        className="input-field"
                        placeholder="+27 82 123 4567"
                    />
                </div>

                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">Credential Type</label>
                    <select
                        name="role"
                        id="role"
                        required
                        className="input-field"
                    >
                        <option value="tenant">Long-Term Tenant (12 Months+)</option>
                        <option value="staff">Business Staff Member</option>
                        <option value="cleaner">Domestic Worker / Cleaner</option>
                    </select>
                </div>

                <div className="bg-secondary/20 border border-border/50 p-4 rounded-xl flex gap-3 text-sm text-muted-foreground mt-6">
                    <KeySquare className="h-5 w-5 text-primary shrink-0" />
                    <p>
                        STid virtual credentials are securely provisioned directly to the user&apos;s mobile device via the STid Mobile ID application. This request will be forwarded to Global Security Solutions for provisioning.
                    </p>
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary flex items-center gap-2"
                >
                    <SmartphoneNfc className="h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'Issue STid Credential'}
                </button>
            </div>
        </form>
    )
}
