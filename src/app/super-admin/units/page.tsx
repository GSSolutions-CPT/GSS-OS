import { createClient } from '@/lib/supabase/server'
import { Building, Plus, Users, Search } from 'lucide-react'
import { revalidatePath } from 'next/cache'

interface Profile {
    id: string
    full_name: string
    email: string
}

interface Unit {
    id: string
    name: string
    type: string
    profiles: Profile[]
}

export default async function UnitManagementPage(props: { searchParams: Promise<{ query?: string }> }) {
    const searchParams = await props.searchParams;
    const query = searchParams?.query || '';

    const supabase = await createClient()

    let unitsQuery = supabase
        .from('units')
        .select(`
            id,
            name,
            type,
            created_at,
            profiles (
                id,
                full_name,
                email
            )
        `)
        .order('name', { ascending: true })

    if (query) {
        unitsQuery = unitsQuery.ilike('name', `%${query}%`)
    }

    const { data: unitsData } = await unitsQuery;
    const units = (unitsData as unknown as Unit[]) || [];

    async function handleAddUnit(formData: FormData) {
        'use server'
        try {
            const supabase = await createClient()
            const name = formData.get('name') as string
            const type = formData.get('type') as string

            if (!name || !type) return

            const { error } = await supabase.from('units').insert({ name, type })
            if (error) throw error

            revalidatePath('/super-admin/units')
        } catch (error) {
            console.error('Failed to add unit:', error)
        }
    }

    async function handleMockCreateAdmin(formData: FormData) {
        'use server'
        try {
            const email = formData.get('email') as string
            const unit_id = formData.get('unit_id') as string

            if (!email || !unit_id) return

            // Dynamically import the admin client ONLY on the server during action execution
            const { adminAuthClient } = await import('@/lib/supabase/admin')

            const { error } = await adminAuthClient.auth.admin.inviteUserByEmail(email, {
                data: {
                    role: 'group_admin',
                    unit_id: unit_id
                }
            })

            if (error) throw error

            revalidatePath('/super-admin/units')
        } catch (error) {
            console.error('Failed to provision admin:', error)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Building className="h-8 w-8 text-primary" />
                        Unit Management
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Create units and assign Group Admin credentials.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Add Unit Form */}
                <div className="lg:col-span-1">
                    <form action={handleAddUnit} className="glass-card rounded-2xl p-6 border border-border/50 sticky top-8">
                        <h2 className="text-lg font-semibold mb-4">Add New Unit</h2>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Unit Name / Number</label>
                                <input
                                    type="text"
                                    name="name"
                                    id="name"
                                    required
                                    className="input-field"
                                    placeholder="e.g. Unit 104"
                                />
                            </div>

                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-foreground mb-1">Property Type</label>
                                <select
                                    name="type"
                                    id="type"
                                    required
                                    className="input-field"
                                >
                                    <option value="residential">Residential</option>
                                    <option value="commercial">Commercial / Business</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
                            >
                                <Plus className="h-4 w-4" /> Add Unit
                            </button>
                        </div>
                    </form>
                </div>

                {/* Units List */}
                <div className="lg:col-span-2 space-y-4">

                    <form method="GET" action="/super-admin/units" className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            name="query"
                            defaultValue={query}
                            placeholder="Search units..."
                            className="input-field pl-10 bg-background/50"
                        />
                    </form>

                    {units.length === 0 ? (
                        <div className="text-center py-12 glass-card rounded-2xl border border-border/50">
                            <Building className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground font-medium">No units found.</p>
                            <p className="text-sm text-muted-foreground/70">{query ? 'Try adjusting your search query.' : 'Use the form to add the first unit.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {units.map((unit) => (
                                <div key={unit.id} className="glass-card rounded-xl p-5 border border-border/50 hover:bg-white/5 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg text-foreground">{unit.name}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${unit.type === 'commercial' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                    {unit.type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {unit.profiles?.length || 0} Group Admin(s) assigned
                                            </p>
                                        </div>

                                        <form action={handleMockCreateAdmin} className="flex gap-2 w-full sm:w-auto">
                                            <input type="hidden" name="unit_id" value={unit.id} />
                                            <input
                                                type="email"
                                                name="email"
                                                placeholder="Admin Email"
                                                required
                                                className="input-field text-sm h-9 w-full sm:w-48"
                                            />
                                            <button type="submit" className="h-9 px-3 rounded-md bg-secondary text-foreground hover:bg-secondary/80 transition-colors text-sm font-medium whitespace-nowrap">
                                                Assign Link
                                            </button>
                                        </form>
                                    </div>

                                    {unit.profiles && unit.profiles.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-border/30 grid gap-2">
                                            {unit.profiles.map((profile) => (
                                                <div key={profile.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Users className="h-3 w-3 text-primary" />
                                                    <span className="text-foreground">{profile.full_name || 'Unnamed Admin'}</span>
                                                    <span className="opacity-50">({profile.email})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
