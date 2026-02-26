'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useState } from 'react'

export function QRCodeDisplay({ value, size = 120 }: { value: string, size?: number }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-block p-1 bg-white rounded-md hover:ring-2 hover:ring-primary transition-all cursor-pointer"
                title="View QR Code"
            >
                <QRCodeSVG value={value} size={size} />
            </button>

            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="glass-card p-8 rounded-2xl flex flex-col items-center gap-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-semibold text-foreground">Access Credential</h3>
                        <div className="p-4 bg-white rounded-xl">
                            <QRCodeSVG value={value} size={256} />
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-mono tracking-wider text-primary font-bold">{value}</p>
                            <p className="text-sm text-muted-foreground mt-2">Scan this code at the gate</p>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="mt-4 w-full py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
