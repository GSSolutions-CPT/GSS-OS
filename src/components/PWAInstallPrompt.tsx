"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function PWAInstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if user already dismissed it previously
        const dismissed = localStorage.getItem("pwa_prompt_dismissed");
        if (dismissed === "true") return;

        // Check if the app is already installed/running in standalone
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isStandaloneActive = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
        if (isStandaloneActive) return;

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setTimeout(() => setIsIOS(isIOSDevice), 0);

        if (isIOSDevice) {
            setTimeout(() => setShowPrompt(true), 0);
        }

        // Capture the Android beforeinstallprompt event
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        });
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === "accepted") {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        localStorage.setItem("pwa_prompt_dismissed", "true");
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] p-4 bg-slate-900/95 text-white rounded-xl shadow-[0_0_15px_rgba(56,189,248,0.5)] border border-sky-500/30 flex flex-col gap-3 backdrop-blur-md">
            <div className="flex justify-between items-start">
                <h3 className="font-semibold text-sky-400">Install Nexus App</h3>
                <button onClick={handleDismiss} className="text-slate-400 hover:text-white transition-colors" aria-label="Close Install Prompt">
                    <X size={20} />
                </button>
            </div>

            {isIOS ? (
                <p className="text-sm text-slate-300">
                    To install, tap the <span className="font-bold text-white">Share</span> icon in Safari, then select <span className="font-bold text-white">Add to Home Screen</span>.
                </p>
            ) : (
                <p className="text-sm text-slate-300">
                    Install the Nexus Security Portal to your home screen for quick, offline-capable access.
                </p>
            )}

            {!isIOS && deferredPrompt && (
                <div className="mt-2 flex gap-3">
                    <button
                        onClick={handleInstallClick}
                        className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium py-2 rounded-lg transition-colors shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                    >
                        Add to Home Screen
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                        Not Now
                    </button>
                </div>
            )}
        </div>
    );
}
