'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function TechnicianApp() {
    const [voltage, setVoltage] = useState(7000);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate flow
        try {
            const res = await fetch('/api/compliance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    site_id: 'technician_manual_entry',
                    technician_id: 'me',
                    voltage: parseInt(voltage.toString()),
                    photo_url: 'https://via.placeholder.com/300?text=Evidence'
                })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="max-w-md mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">GSS Tech Ops</h1>
                    <Link href="/" className="text-gray-400 text-sm">Exit</Link>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Site Check-In</label>
                            <input type="text" value="Site A - Main Fence" disabled className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Voltage Reading (Volts)</label>
                            <input
                                type="number"
                                value={voltage}
                                onChange={(e) => setVoltage(parseInt(e.target.value))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white text-lg font-mono"
                            />
                            <p className="text-xs text-gray-500 mt-1">Minimum required: 6000V</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Photo Evidence</label>
                            <div className="h-32 bg-gray-700 border-2 border-dashed border-gray-500 rounded-lg flex items-center justify-center text-gray-400">
                                [Camera Mock]
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            {loading ? 'Uploading...' : 'Submit Compliance Log'}
                        </button>
                    </form>

                    {result && (
                        <div className={`mt-6 p-4 rounded-lg flex items-center justify-between ${result.status === 'COMPLIANT' ? 'bg-green-900/50 border border-green-500' :
                                result.status === 'WARNING' ? 'bg-yellow-900/50 border border-yellow-500' :
                                    'bg-red-900/50 border border-red-500'
                            }`}>
                            <div>
                                <p className="font-bold text-lg">{result.status}</p>
                                <p className="text-xs text-gray-300">Logged ID: {result.data.id}</p>
                            </div>
                            <div className="text-3xl">
                                {result.status === 'COMPLIANT' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌'}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
