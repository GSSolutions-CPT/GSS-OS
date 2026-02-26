'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, Activity, Building, ScrollText, Megaphone, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function SuperAdminSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const links = [
        { name: 'System Health', href: '/super-admin', icon: Activity },
        { name: 'Unit Management', href: '/super-admin/units', icon: Building },
        { name: 'Global Audit Logs', href: '/super-admin/logs', icon: ScrollText },
        { name: 'Announcements', href: '/super-admin/announcements', icon: Megaphone },
    ]

    async function handleLogout() {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-card/50 glass text-card-foreground">
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-border/50">
                <ShieldCheck className="h-6 w-6 text-primary mr-2" />
                <span className="font-bold tracking-tight text-lg text-foreground">Nexus Vercel</span>
            </div>

            <div className="px-6 py-4 border-b border-border/50">
                <span className="text-[10px] uppercase font-bold tracking-wider text-destructive">Super Admin</span>
            </div>

            <nav className="flex-1 space-y-2 px-4 py-6">
                {links.map((link) => {
                    const isActive = pathname === link.href
                    const Icon = link.icon
                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {link.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    )
}
