'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, PlusCircle, LogOut, SmartphoneNfc } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const links = [
        { name: 'Visitors', href: '/dashboard', icon: Users },
        { name: 'Invite', href: '/dashboard/invite', icon: PlusCircle },
        { name: 'STid Request', href: '/dashboard/stid', icon: SmartphoneNfc },
    ]

    async function handleLogout() {
        await supabase.auth.signOut()
        router.refresh()
        router.push('/login')
    }

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-card/50 glass text-card-foreground">
            <div className="flex h-20 shrink-0 items-center justify-center px-6 border-b border-border/50 py-4 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]">
                <Image src="/logo.svg" alt="Global Security Solutions" width={160} height={50} className="object-contain" priority />
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

            {/* Dashboard Upsell Widget */}
            <div className="mx-4 mb-4 p-4 rounded-xl relative overflow-hidden group border border-border/50 bg-background/50">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-500/10 opacity-50 transition-opacity group-hover:opacity-100" />
                <div className="relative z-10 flex flex-col gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Secure Your Unit</span>
                    <h4 className="text-sm font-semibold text-foreground leading-tight">Install AJAX Alarms & Hikvision CCTV</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-2">Beat load-shedding with our integrated smart security systems.</p>
                    <a href="https://gssolutions.co.za" target="_blank" rel="noreferrer" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors inline-block text-center py-2 px-3 bg-primary/10 rounded-lg">
                        Get a Free Quote
                    </a>
                </div>
            </div>

            <div className="p-4 border-t border-border/50">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div >
    )
}
