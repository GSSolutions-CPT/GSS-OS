'use client'

import { useState } from 'react'
import { Save, Loader2, Wifi, ClipboardList, Clock, CheckCircle2 } from 'lucide-react'
import { updateBuildingSettings } from './actions'

type Settings = {
    house_rules: string
    wifi_ssid: string
    wifi_password: string
    check_in_time: string
    check_out_time: string
}

export default function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
    const [settings, setSettings] = useState(initialSettings)
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setSaved(false)
        try {
            await updateBuildingSettings(settings)
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to update settings')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* WiFi Settings */}
                <div className="glass-card p-6 rounded-2xl border border-border/50 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Wifi className="h-5 w-5" />
                        <h2 className="font-semibold text-foreground">Guest Wi-Fi</h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground uppercase font-bold px-1">Network Name (SSID)</label>
                            <input
                                type="text"
                                value={settings.wifi_ssid}
                                onChange={e => setSettings({ ...settings, wifi_ssid: e.target.value })}
                                className="w-full mt-1 bg-white/5 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground uppercase font-bold px-1">Password</label>
                            <input
                                type="text"
                                value={settings.wifi_password}
                                onChange={e => setSettings({ ...settings, wifi_password: e.target.value })}
                                className="w-full mt-1 bg-white/5 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Timing Settings */}
                <div className="glass-card p-6 rounded-2xl border border-border/50 space-y-4">
                    <div className="flex items-center gap-2 text-primary">
                        <Clock className="h-5 w-5" />
                        <h2 className="font-semibold text-foreground">Stay Policies</h2>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-muted-foreground uppercase font-bold px-1">Check-in Time</label>
                            <input
                                type="text"
                                value={settings.check_in_time}
                                onChange={e => setSettings({ ...settings, check_in_time: e.target.value })}
                                className="w-full mt-1 bg-white/5 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground uppercase font-bold px-1">Check-out Time</label>
                            <input
                                type="text"
                                value={settings.check_out_time}
                                onChange={e => setSettings({ ...settings, check_out_time: e.target.value })}
                                className="w-full mt-1 bg-white/5 border border-border/50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* House Rules */}
            <div className="glass-card p-6 rounded-2xl border border-border/50 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                    <ClipboardList className="h-5 w-5" />
                    <h2 className="font-semibold text-foreground">House Rules</h2>
                </div>
                <div>
                    <textarea
                        rows={6}
                        value={settings.house_rules}
                        onChange={e => setSettings({ ...settings, house_rules: e.target.value })}
                        className="w-full mt-1 bg-white/5 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none font-mono"
                        placeholder="Enter building rules, one per line..."
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
                {saved && (
                    <span className="text-green-500 text-sm flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Changes saved successfully
                    </span>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center gap-2 px-8"
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    Save Configuration
                </button>
            </div>
        </form>
    )
}
