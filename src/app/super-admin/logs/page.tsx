import { createClient } from '@/lib/supabase/server'
import { ScrollText, Calendar, Activity, User, Key, ChevronLeft, ChevronRight } from 'lucide-react'
import ExportButtons from './ExportButtons'
import { format } from 'date-fns'
import Link from 'next/link'

interface Profile {
    full_name: string | null
    role: string | null
}

interface AuditLog {
    id: string
    action: string
    details: Record<string, unknown>
    created_at: string
    profiles: Profile | Profile[] | null
}

export default async function GlobalAuditLogsPage(props: { searchParams: Promise<{ page?: string }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()

    // Pagination setup
    const ITEMS_PER_PAGE = 50
    const currentPage = parseInt(searchParams?.page || '1', 10)
    const from = (currentPage - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    // Fetch the paginated logs
    const { data: logsData } = await supabase
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
        .range(from, to)

    const logs = (logsData as unknown as AuditLog[]) || []
    const hasNextPage = logs.length === ITEMS_PER_PAGE

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

                <ExportButtons />
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
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                        No audit logs recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const profileName = Array.isArray(log.profiles)
                                        ? log.profiles[0]?.full_name
                                        : log.profiles?.full_name;

                                    return (
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
                                                {profileName || 'System Operator'}
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
                                                <code className="bg-secondary/50 px-2 py-1 rounded text-xs block max-w-xs truncate" title={JSON.stringify(log.details)}>
                                                    {JSON.stringify(log.details)}
                                                </code>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-border/50 bg-secondary/10 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing logs {logs.length > 0 ? from + 1 : 0} to {from + logs.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href={`?page=${currentPage - 1}`}
                            className={`btn-secondary p-2 inline-flex items-center justify-center rounded-md ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                            aria-disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous Page</span>
                        </Link>

                        <span className="text-sm font-medium px-2">Page {currentPage}</span>

                        <Link
                            href={`?page=${currentPage + 1}`}
                            className={`btn-secondary p-2 inline-flex items-center justify-center rounded-md ${!hasNextPage ? 'pointer-events-none opacity-50' : ''}`}
                            aria-disabled={!hasNextPage}
                        >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next Page</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
