import { SmartphoneNfc } from 'lucide-react'
import StidRequestForm from './StidRequestForm'

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

            <StidRequestForm />
        </div>
    )
}
