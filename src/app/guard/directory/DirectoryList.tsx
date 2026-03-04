'use client'

import { useState } from 'react'
import { PhoneCall, Search, Hash, Building2 } from 'lucide-react'

type UnitData = { name?: string; type?: string }

type Profile = {
    id: string
    full_name: string | null
    role: string
    units: UnitData | UnitData[] | null
}

export default function DirectoryList({ initialProfiles }: { initialProfiles: Profile[] }) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredProfiles = initialProfiles.filter(p => {
        const unitData = Array.isArray(p.units) ? p.units[0] : p.units
        const unitName = unitData?.name
        const searchString = `${p.full_name || ''} ${unitName || ''}`.toLowerCase()
        return searchString.includes(searchQuery.toLowerCase())
    })

    return (
        <div className="glass-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search residents or units..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-input/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-card/50 border-b border-border/50">
                        <tr>
                            <th className="px-6 py-4 font-medium"><Hash className="h-4 w-4 inline mr-1" /> Unit</th>
                            <th className="px-6 py-4 font-medium"><Building2 className="h-4 w-4 inline mr-1" /> Type</th>
                            <th className="px-6 py-4 font-medium">Contact Name</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProfiles.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                    No contacts found matching &quot;{searchQuery}&quot;
                                </td>
                            </tr>
                        ) : (
                            filteredProfiles.map((p) => {
                                const unitData = Array.isArray(p.units) ? p.units[0] : p.units
                                const unitName = unitData?.name || 'Unknown Unit'
                                const unitType = unitData?.type || 'residential'

                                return (
                                    <tr key={p.id} className="border-b border-border/50 hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-medium text-foreground">
                                            {unitName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${unitType === 'business' || unitType === 'commercial' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                                                }`}>
                                                {unitType === 'business' ? 'commercial' : unitType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            <div className="font-medium text-foreground">{p.full_name || 'Unassigned'}</div>
                                            <div className="text-xs">Primary Admin</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2 rounded-lg transition-all shadow-[0_4px_14px_0_rgba(37,99,235,0.2)]">
                                                <PhoneCall className="h-4 w-4 mr-2" />
                                                Call Unit
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
