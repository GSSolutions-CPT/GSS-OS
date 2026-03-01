'use client'

import { useState } from 'react'
import { PlusCircle, Trash2, Calendar, Clock } from 'lucide-react'

export type AccessWindow = {
    date: string        // YYYY-MM-DD
    start_time: string  // HH:MM (24h)
    end_time: string    // HH:MM (24h)
}

interface AccessWindowPickerProps {
    windows: AccessWindow[]
    onChange: (windows: AccessWindow[]) => void
}

export function AccessWindowPicker({ windows, onChange }: AccessWindowPickerProps) {
    const [newDate, setNewDate] = useState('')

    const today = new Date().toISOString().split('T')[0]

    const addWindow = () => {
        if (!newDate) return
        // Prevent duplicate dates
        if (windows.some(w => w.date === newDate)) return

        const updated = [...windows, { date: newDate, start_time: '06:00', end_time: '22:00' }]
        // Keep sorted by date
        updated.sort((a, b) => a.date.localeCompare(b.date))
        onChange(updated)
        setNewDate('')
    }

    const removeWindow = (index: number) => {
        onChange(windows.filter((_, i) => i !== index))
    }

    const updateWindow = (index: number, field: keyof AccessWindow, value: string) => {
        const updated = windows.map((w, i) => i === index ? { ...w, [field]: value } : w)
        onChange(updated)
    }

    return (
        <div className="space-y-4">
            {/* Add a day */}
            <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-semibold text-foreground/90 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Add Access Day
                    </label>
                    <input
                        type="date"
                        value={newDate}
                        min={today}
                        onChange={e => setNewDate(e.target.value)}
                        className="w-full bg-input/40 border border-border/80 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm text-foreground [color-scheme:dark]"
                    />
                </div>
                <button
                    type="button"
                    onClick={addWindow}
                    disabled={!newDate}
                    className="mb-0.5 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl transition-all font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <PlusCircle className="h-4 w-4" />
                    Add
                </button>
            </div>

            {/* Window List */}
            {windows.length === 0 ? (
                <div className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center text-muted-foreground text-sm">
                    No access days added yet. Add at least one day above.
                </div>
            ) : (
                <div className="space-y-3">
                    {windows.map((w, i) => (
                        <div key={w.date} className="flex items-center gap-3 p-4 bg-secondary/30 border border-border/50 rounded-xl group">
                            {/* Date badge */}
                            <div className="flex items-center gap-2 min-w-[130px]">
                                <Calendar className="h-4 w-4 text-primary shrink-0" />
                                <span className="text-sm font-semibold text-foreground">
                                    {new Date(w.date + 'T00:00').toLocaleDateString(undefined, {
                                        weekday: 'short', month: 'short', day: 'numeric'
                                    })}
                                </span>
                            </div>

                            {/* Time range */}
                            <div className="flex items-center gap-2 flex-1">
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                                <input
                                    type="time"
                                    value={w.start_time}
                                    onChange={e => updateWindow(i, 'start_time', e.target.value)}
                                    className="w-28 bg-input/40 border border-border/80 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                                />
                                <span className="text-muted-foreground text-xs font-medium">to</span>
                                <input
                                    type="time"
                                    value={w.end_time}
                                    onChange={e => updateWindow(i, 'end_time', e.target.value)}
                                    className="w-28 bg-input/40 border border-border/80 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                                />
                            </div>

                            {/* Remove */}
                            <button
                                type="button"
                                onClick={() => removeWindow(i)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                title="Remove this day"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden serialized input for form submission */}
            <input
                type="hidden"
                name="access_windows"
                value={JSON.stringify(windows)}
            />
        </div>
    )
}
