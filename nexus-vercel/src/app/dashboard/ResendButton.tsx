'use client'

import { useState, useTransition } from 'react'
import { RefreshCcw, Check } from 'lucide-react'

export function ResendButton({ visitorId }: { visitorId: string }) {
    const [isPending, startTransition] = useTransition()
    const [done, setDone] = useState(false)

    const handleResend = () => {
        startTransition(async () => {
            // Mocking a server action for resending an SMS/Email link
            console.log(`Resending link to visitor: ${visitorId}`)
            await new Promise((resolve) => setTimeout(resolve, 800))
            setDone(true)
            setTimeout(() => setDone(false), 2000)
        })
    }

    if (done) {
        return (
            <button disabled className="text-xs font-medium text-green-500 bg-green-500/10 px-3 py-1.5 rounded-md flex items-center gap-1">
                <Check className="h-3 w-3" /> Resent
            </button>
        )
    }

    return (
        <button
            onClick={handleResend}
            disabled={isPending}
            className={`text-xs font-medium text-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md border border-border/50 hover:border-primary/50 flex items-center gap-1 ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <RefreshCcw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? 'Sending...' : 'Resend Link'}
        </button>
    )
}
