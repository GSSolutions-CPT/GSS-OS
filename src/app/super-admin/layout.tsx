import { SuperAdminSidebar } from '@/components/SuperAdminSidebar'

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col">
                <SuperAdminSidebar />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Decorative background blurs inside dashboard */}
                <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-destructive/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Mobile top nav could go here */}

                <main className="flex-1 overflow-y-auto z-10 p-4 md:p-8 flex flex-col">
                    <div className="flex-1">
                        {children}
                    </div>

                    {/* Admin Watermark */}
                    <footer className="mt-8 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
                        <p>System engineered and maintained by <span className="font-semibold text-primary">Global Security Solutions</span> | 24/7 Support: <a href="tel:0629558559" className="hover:text-primary transition-colors">062 955 8559</a></p>
                    </footer>
                </main>
            </div>
        </div>
    )
}
