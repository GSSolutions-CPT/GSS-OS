import { createClient } from '@/lib/supabase/server'
import { PlusCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { QRCodeDisplay } from '@/components/QRCodeDisplay'

export default async function DashboardPage() {
    const supabase = await createClient()

    await supabase.auth.getUser()

    // Fetch visitors for this owner (RLS handles isolation)
    const { data: visitors } = await supabase
        .from('visitors')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Visitors</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage your incoming guests and active credentials.
                    </p>
                </div>
                <Link
                    href="/dashboard/invite"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-[0_4px_14px_0_rgba(250,204,21,0.2)]"
                >
                    <PlusCircle className="h-4 w-4" />
                    Invite Visitor
                </Link>
            </div>

            <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search visitors..."
                            className="w-full pl-9 pr-4 py-2 bg-input/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-muted-foreground">
                        <thead className="text-xs text-muted-foreground uppercase bg-card/50 border-b border-border/50">
                            <tr>
                                <th className="px-6 py-4 font-medium">Visitor Name</th>
                                <th className="px-6 py-4 font-medium">Access Date</th>
                                <th className="px-6 py-4 font-medium">Credential</th>
                                <th className="px-6 py-4 font-medium text-right">QR Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!visitors || visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                        No visitors found. Click &apos;Invite Visitor&apos; to add one.
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((visitor) => (
                                    <tr key={visitor.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">
                                            {visitor.visitor_name}
                                            <div className="text-xs text-muted-foreground font-normal mt-0.5">{visitor.visitor_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(visitor.access_date).toLocaleDateString(undefined, {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                                {visitor.credential_number}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <QRCodeDisplay value={visitor.credential_number.toString()} size={40} />
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
