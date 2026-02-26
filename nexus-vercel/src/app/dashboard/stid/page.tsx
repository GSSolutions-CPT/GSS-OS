import { KeySquare, SmartphoneNfc } from 'lucide-react'

export default async function StidRequestPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <SmartphoneNfc className="h-8 w-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                    Long-Term STid Credentials
                </h1>
                <p className="text-muted-foreground mt-2">
                    Request permanent mobile Bluetooth credentials for new long-term tenants or staff.
                </p>
            </div>

            <form className="glass-card rounded-2xl p-6 border border-border/50 space-y-6">
                <div className="space-y-4">
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
                        disabled
                        className="btn-primary flex items-center gap-2 opacity-50 cursor-not-allowed"
                    >
                        <SmartphoneNfc className="h-4 w-4" /> Issue STid Credential
                    </button>
                    <span className="text-xs text-muted-foreground ml-4 self-center">(Mock disabled for Phase 2)</span>
                </div>
            </form>
        </div>
    )
}
