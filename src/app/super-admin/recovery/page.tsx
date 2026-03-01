import { RefreshCw } from 'lucide-react'
import { getRetryQueue } from './actions'
import RecoveryTable from './RecoveryTable'

export default async function RecoveryPage() {
    const queue = await getRetryQueue()

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <RefreshCw className="h-8 w-8 text-primary drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
                    API Recovery Sync
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage and manually retry failed hardware synchronizations to the on-premise Impro bridge.
                </p>
            </div>

            <RecoveryTable initialItems={queue as any[]} />
        </div>
    )
}
