import { ShieldCheck } from 'lucide-react'

export function GuestAdBanner() {
    return (
        <a
            href="https://gssolutions.co.za"
            target="_blank"
            rel="noopener noreferrer"
            className="group block w-full mt-6 p-4 rounded-xl border border-primary/20 bg-card/40 glass text-card-foreground hover:bg-card/60 transition-all hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(250,204,21,0.15)] relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
                <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-foreground leading-tight flex items-center gap-2">
                        <span className="text-primary group-hover:underline">🔒 This Premises is Secured</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        by Global Security Solutions - Cape Town&apos;s #1 Rated Installer
                    </p>
                </div>
            </div>
        </a>
    )
}
