import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col">
                <Sidebar />
            </div>

            <div className="flex flex-1 flex-col overflow-hidden relative">
                {/* Decorative background blurs inside dashboard */}
                <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                {/* Mobile top nav could go here */}

                <main className="flex-1 overflow-y-auto z-10 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
