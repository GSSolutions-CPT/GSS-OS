'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    ScanLine,
    LogOut,
    Car,
    PhoneCall,
    ShieldCheck
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
    { icon: ScanLine, label: 'Access Control', href: '/guard' },
    { icon: Car, label: 'Parking Roster', href: '/guard/parking' },
    { icon: PhoneCall, label: 'Resident Directory', href: '/guard/directory' },
]

export function GuardSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <aside className="w-64 border-r border-border/50 bg-card/30 backdrop-blur-xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
            <div className="p-6 border-b border-border/50 flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                    <ShieldCheck className="text-white w-6 h-6" />
                </div>
                <div>
                    <h2 className="font-bold text-lg tracking-tight leading-none text-foreground">Guard Station</h2>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Security Portal</span>
                </div>
            </div>

            <div className="flex-1 py-8 px-4 flex flex-col gap-2 relative">
                <nav className="space-y-1.5 flex-1 p-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.5)]' : ''}`} />
                                <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-border/50 mt-auto bg-card/50">
                <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors text-sm font-medium"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    )
}
