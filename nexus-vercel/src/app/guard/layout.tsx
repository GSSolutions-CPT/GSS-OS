import type { Metadata } from 'next'
import { GuardSidebar } from '../../components/GuardSidebar'

export const metadata: Metadata = {
    title: 'Guard Dashboard | Global Security Solutions',
    description: 'Security officer and entrance management interface.',
}

export default function GuardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen relative overflow-hidden bg-background">
            {/* Dark/Blue animated background gradient */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/30 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
            </div>

            <GuardSidebar />

            <div className="flex-1 flex flex-col min-w-0 relative z-10 transition-all duration-300 ml-0 md:ml-64">
                <main className="flex-1 p-4 md:p-8 lg:p-12 pb-24 max-w-7xl mx-auto w-full">
                    {children}
                </main>

                {/* Admin Watermark Footer */}
                <footer className="w-full border-t border-border/40 bg-background/50 backdrop-blur-md py-4 mt-auto">
                    <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground/60 gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-primary/70">Global Security Solutions</span>
                            <span className="hidden md:inline">&bull;</span>
                            <span>System engineered and maintained locally.</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="hover:text-primary transition-colors cursor-pointer">24/7 Support: 062 955 8559</span>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    )
}
