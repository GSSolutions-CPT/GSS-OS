'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function VisitorAccess() {
    const [guestName, setGuestName] = useState('');
    const [qrCode, setQrCode] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName) return;

        try {
            const res = await fetch('/api/visitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guest_name: guestName,
                    expires_in_minutes: 60 * 24 // Airbnb Mode: 24h default (simulated)
                })
            });
            const data = await res.json();
            setQrCode(data.qr_image);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-white p-8">
            <div className="max-w-lg mx-auto">
                <div className="mb-8">
                    <Link href="/" className="text-gray-500 hover:text-black">← Back</Link>
                </div>
                <h1 className="text-3xl font-bold mb-6">Visitor Access Control</h1>

                <div className="bg-white border shadow-xl rounded-2xl p-8">
                    {!qrCode ? (
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
                                <input
                                    type="text"
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="w-full border rounded-lg px-4 py-2"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-800">Airbnb Mode Active</h3>
                                <p className="text-xs text-blue-600">Key expires automatically at 10:00 AM on Checkout.</p>
                            </div>

                            <button className="w-full bg-black text-white rounded-lg py-3 font-semibold hover:bg-gray-800 transition-colors">
                                Generate Digital Key
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full inline-block text-sm font-semibold">
                                Pass Generated
                            </div>
                            <img src={qrCode} alt="QR Code" className="mx-auto w-48 h-48 border-4 border-black rounded-lg" />
                            <p className="font-mono text-sm break-all text-gray-500">Share this QR code with the guest.</p>

                            <button onClick={() => setQrCode(null)} className="text-sm text-blue-600 underline">
                                Generate Another
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
