'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [alarms, setAlarms] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch('/api/feed');
            const data = await res.json();
            setAlarms(data.alarms || []);
        };
        fetchData();
        const interval = setInterval(fetchData, 1000); // Fast polling for "Live Feed"
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black text-green-400 font-mono p-4">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8 border-b border-green-800 pb-4">
                    <h1 className="text-3xl font-bold tracking-widest">GSS COMMAND CENTER</h1>
                    <div className="flex gap-4">
                        <span className="animate-pulse">● LIVE</span>
                        <Link href="/" className="hover:text-white">EXIT</Link>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Alarms Panel */}
                    <div className="border border-green-800 p-4 rounded bg-gray-900">
                        <h2 className="text-xl mb-4 text-white">INTRUSION ALARMS</h2>
                        <div className="space-y-2 h-[500px] overflow-y-auto">
                            {alarms.length === 0 && <span className="opacity-50">No Active Alarms... System Secure.</span>}
                            {alarms.slice().reverse().map((alarm: any) => (
                                <div key={alarm.id} className={`p-2 border-l-4 ${alarm.status === 'OPEN' ? 'border-red-500 bg-red-900/20' : 'border-green-500 bg-green-900/10'}`}>
                                    <div className="flex justify-between">
                                        <span>ZN:{alarm.zone_id} [{alarm.status}]</span>
                                        <span className="text-xs opacity-70">{new Date(alarm.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-xs mt-1 opacity-60">Partition {alarm.partition} | EVT: {alarm.event_group}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div className="border border-green-800 p-4 rounded bg-gray-900 flex items-center justify-center opacity-50">
                        [GEOSPATIAL VIEW OFFLINE]
                    </div>
                </div>
            </div>
        </div>
    );
}
