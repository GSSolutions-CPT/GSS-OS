import { createClient } from '@/lib/supabase/server'
import { Megaphone, Send, Clock, Trash2 } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import { formatDistanceToNow } from 'date-fns'

export default async function AnnouncementsPage() {
    const supabase = await createClient()

    // Fetch announcements
    const { data: announcements } = await supabase
        .from('announcements')
        .select(`
            id,
            message,
            created_at,
            profiles (
                full_name
            )
        `)
        .order('created_at', { ascending: false })

    async function handlePostAnnouncement(formData: FormData) {
        'use server'
        const supabase = await createClient()
        const message = formData.get('message') as string

        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user || !message) return

        await supabase.from('announcements').insert({
            message,
            author_id: userData.user.id
        })

        revalidatePath('/super-admin/announcements')
    }

    async function handleDelete(id: string) {
        'use server'
        const supabase = await createClient()
        await supabase.from('announcements').delete().eq('id', id)
        revalidatePath('/super-admin/announcements')
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 flex flex-col h-[calc(100vh-8rem)]">
            <div className="shrink-0 mb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Megaphone className="h-8 w-8 text-primary" />
                    Community Announcements
                </h1>
                <p className="text-muted-foreground mt-2">
                    Broadcast critical messages, maintenance windows, and security updates to all Group Admins.
                </p>
            </div>

            {/* Announcements Feed */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {announcements?.length === 0 ? (
                    <div className="text-center py-16 glass-card rounded-2xl border border-border/50">
                        <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground font-medium">No active announcements.</p>
                        <p className="text-sm text-muted-foreground/70">Broadcast a message below to reach all users.</p>
                    </div>
                ) : (
                    announcements?.map((announcement: { id: string, message: string, created_at: string, profiles: unknown }) => (
                        <div key={announcement.id} className="relative group glass-card rounded-2xl p-6 border border-border/50 pl-0 overflow-hidden">
                            {/* Accent line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />

                            <div className="pl-6 pr-12">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}</span>
                                    <span className="px-2">—</span>
                                    <span>Posted by {(Array.isArray(announcement.profiles) ? (announcement.profiles[0] as { full_name?: string })?.full_name : (announcement.profiles as { full_name?: string })?.full_name) || 'Admin'}</span>
                                </div>
                                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
                                    {announcement.message}
                                </p>
                            </div>

                            {/* Delete Button (Hover) */}
                            <form action={handleDelete.bind(null, announcement.id)} className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button type="submit" className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete Announcement">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </form>
                        </div>
                    ))
                )}
            </div>

            {/* Post Input Fixed Bottom */}
            <form action={handlePostAnnouncement} className="shrink-0 glass-card rounded-2xl p-4 border border-border/50 bg-background/80 backdrop-blur-xl sticky bottom-0 z-20">
                <div className="flex items-end gap-3 rounded-xl bg-background/50 border border-border/50 p-2 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                    <textarea
                        name="message"
                        required
                        rows={2}
                        placeholder="Type your message here... E.g. Power maintenance scheduled for tomorrow at 2 PM."
                        className="w-full bg-transparent border-none rounded-lg text-sm text-foreground focus:ring-0 p-3 pb-1 resize-none h-auto min-h-[44px]"
                    />
                    <button
                        type="submit"
                        className="btn-primary shrink-0 h-10 w-10 p-0 rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    )
}
