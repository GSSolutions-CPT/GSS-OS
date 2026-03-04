'use client'

import { useState } from 'react'
import { resendCredential } from './actions'
import { RefreshCcw, Check } from 'lucide-react'

export function ResendButton({ visitorId }: { visitorId: string }) {
    const [isPending, setIsPending] = useState(false)
    const [done, setDone] = useState(false)

    const handleResend = async () => {
        setIsPending(true)
        try {
            const result = await resendCredential(visitorId)
            if (result.error) {
                alert(result.error)
                return
            }
            setDone(true)
            setTimeout(() => setDone(false), 2000)
        } catch (error: unknown) {
            alert((error as Error)?.message || 'Failed to resend credential')
        } finally {
            setIsPending(false)
        }
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
