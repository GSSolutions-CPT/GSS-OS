'use client'

import { useState } from 'react'
import { RefreshCw, Trash2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { retrySync, deleteRetryItem } from './actions'

type QueueItem = {
    id: string
    visitor_id: string
    payload: Record<string, unknown>
    status: 'pending' | 'processing' | 'failed' | 'completed'
    retry_count: number
    created_at: string
    visitors: {
        visitor_name: string
        access_date: string
    } | null
}

export default function RecoveryTable({ initialItems }: { initialItems: QueueItem[] }) {
    const [items, setItems] = useState(initialItems)
    const [processing, setProcessing] = useState<string | null>(null)

    async function handleRetry(id: string) {
        setProcessing(id)
        try {
            await retrySync(id)
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, status: 'completed' } : item
            ))
        } catch (error: any) {
            alert(error.message || 'Retry failed')
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, status: 'failed', retry_count: item.retry_count + 1 } : item
            ))
        } finally {
            setProcessing(null)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to remove this item from the queue?')) return
        try {
            await deleteRetryItem(id)
            setItems(prev => prev.filter(item => item.id !== id))
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Delete failed')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'failed': return <XCircle className="h-4 w-4 text-destructive" />
            case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
            default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-card/50 border-b border-border/50">
                        <tr>
                            <th className="px-6 py-4 font-medium">Visitor</th>
                            <th className="px-6 py-4 font-medium">Access Date</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Retries</th>
                            <th className="px-6 py-4 font-medium">Created</th>
                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground font-medium italic">
                                    Queue is empty. No hardware sync issues detected.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {item.visitors?.visitor_name || 'Deleted Visitor'}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {item.visitors?.access_date || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 capitalize">
                                            {getStatusIcon(item.status)}
                                            {item.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {item.retry_count}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground text-xs font-mono">
                                        {new Date(item.created_at).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {item.status !== 'completed' && (
                                            <button
                                                onClick={() => handleRetry(item.id)}
                                                disabled={processing === item.id}
                                                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                                                title="Retry Sync"
                                            >
                                                <RefreshCw className={`h-4 w-4 ${processing === item.id ? 'animate-spin' : ''}`} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                                            title="Delete Item"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
