import Link from 'next/link';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-950 text-white">
            <h1 className="text-4xl font-bold mb-8 text-blue-500">GSS-OS</h1>
            <p className="mb-12 text-gray-400">Select your Portal</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <Link href="/dashboard" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-800 hover:text-white border-gray-700 bg-gray-900">
                    <h2 className="mb-3 text-2xl font-semibold">
                        Business Portal <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        View Staff Attendance and Site Reports.
                    </p>
                </Link>

                <Link href="/technician" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-800 hover:text-white border-gray-700 bg-gray-900">
                    <h2 className="mb-3 text-2xl font-semibold">
                        Technician App <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Log Compliance Checks and Upload Evidence.
                    </p>
                </Link>

                <Link href="/admin" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-800 hover:text-white border-gray-700 bg-gray-900">
                    <h2 className="mb-3 text-2xl font-semibold">
                        Super Admin (Live) <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Real-time feed of Alarms and System Events.
                    </p>
                </Link>

                <Link href="/admin/visitor" className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-800 hover:text-white border-gray-700 bg-gray-900">
                    <h2 className="mb-3 text-2xl font-semibold">
                        Visitor Access <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">-&gt;</span>
                    </h2>
                    <p className="m-0 max-w-[30ch] text-sm opacity-50">
                        Generate WhatsApp Access Codes for Guests.
                    </p>
                </Link>
            </div>
        </main>
    );
}
