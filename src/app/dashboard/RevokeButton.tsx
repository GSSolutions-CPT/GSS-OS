'use client'

import { useTransition } from 'react'
import { revokeVisitor } from './actions'
import { Ban, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function RevokeButton({ visitorId }: { visitorId: string }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    return (
        <button
            onClick={() => {
                startTransition(async () => {
                    await revokeVisitor(visitorId)
                    router.refresh()
                })
            }}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs font-semibold text-destructive/80 hover:text-destructive transition-colors disabled:opacity-50"
            title="Revoke Pass"
        >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
            Revoke
        </button>
    )
}
