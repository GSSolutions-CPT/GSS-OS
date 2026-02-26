import { createClient } from '@/lib/supabase/server'
import { ScrollText, Download, Calendar, Activity, User, Key } from 'lucide-react'
import { format } from 'date-fns'

export default async function GlobalAuditLogsPage() {
    const supabase = await createClient()

    // Fetch the 100 most recent logs
    const { data: logs } = await supabase
        .from('audit_logs')
        .select(`
            id,
            action,
            details,
            created_at,
            profiles (
                full_name,
                role
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <ScrollText className="h-8 w-8 text-primary" />
                        Global Audit Logs
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Comprehensive tracking of all system actions, credential generations, and hardware syncs.
                    </p>
                </div>

                <button className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap">
                    <Download className="h-4 w-4" /> Export CSV
                </button>
            </div>

            <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/50 bg-secondary/20">
                                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Date & Time</div>
                                </th>
                                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <div className="flex items-center gap-2"><User className="h-4 w-4" /> Actor</div>
                                </th>
                                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                    <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> Action</div>
                                </th>
                                <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <div className="flex items-center gap-2"><Key className="h-4 w-4" /> Details</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {logs?.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No audit logs recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs?.map((log: { id: string, created_at: string, action: string, details: Record<string, unknown>, profiles: Record<string, unknown> | Record<string, unknown>[] }) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-foreground">
                                                    {format(new Date(log.created_at), 'MMM d, yyyy')}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {format(new Date(log.created_at), 'HH:mm:ss')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-sm text-muted-foreground">
                                            {Array.isArray(log.profiles) ? (log.profiles[0] as { full_name?: string })?.full_name : (log.profiles as { full_name?: string })?.full_name || 'System Operator'}
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${log.action.includes('INVIT') ? 'bg-green-500/10 text-green-500' :
                                                log.action.includes('REVOKE') ? 'bg-destructive/10 text-destructive' :
                                                    log.action.includes('SYNC') ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-secondary text-secondary-foreground'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground min-w-[300px]">
                                            <code className="bg-secondary/50 px-2 py-1 rounded text-xs break-all block">
                                                {JSON.stringify(log.details)}
                                            </code>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
