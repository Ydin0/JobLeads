import { Card } from '@/components/ui/card'
import { Filter, Zap } from 'lucide-react'

export function MoreFeatures() {
    return (
        <section>
            <div className="@container py-16 [--color-card:transparent] lg:py-24">
                <div className="mx-auto w-full max-w-5xl px-6">
                    <div>
                        <span className="text-primary font-mono text-sm uppercase">What you get</span>
                        <div className="mt-8 grid items-end gap-6 md:grid-cols-2">
                            <h2 className="text-foreground text-4xl font-semibold md:text-5xl">Lead generation that converts and scales</h2>
                            <div className="lg:pl-12">
                                <p className="text-muted-foreground text-balance">Discover companies actively hiring and reach decision makers before your competitors do.</p>
                            </div>
                        </div>
                    </div>
                    <div className="@xl:grid-cols-2 mt-16 grid gap-6 [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)] *:shadow-lg *:shadow-black/5 lg:-mx-8">
                        <Card className="group grid gap-8 rounded-2xl p-8">
                            <div>
                                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-zinc-800">
                                    <Filter className="size-6 text-foreground" />
                                </div>
                                <h3 className="text-foreground font-semibold">Advanced Filtering</h3>
                                <p className="text-muted-foreground mt-3 text-balance">Filter by industry, company size, location, job title, and more to find exactly the leads you need.</p>
                            </div>
                            <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">Industry:</span>
                                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">Technology</span>
                                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">Finance</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">Company Size:</span>
                                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">50-200</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground">Location:</span>
                                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">USA</span>
                                    <span className="rounded bg-zinc-800 px-2 py-1 text-xs">UK</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="group grid gap-8 overflow-hidden rounded-2xl p-8">
                            <div>
                                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-zinc-800">
                                    <Zap className="size-6 text-foreground" />
                                </div>
                                <h3 className="text-foreground font-semibold">Real-Time Alerts</h3>
                                <p className="text-muted-foreground mt-3 text-balance">Get notified instantly when new jobs matching your criteria are posted. Never miss an opportunity.</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                                    <div className="size-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">New: Senior Developer at TechCorp</span>
                                    <span className="ml-auto text-xs text-muted-foreground">2m ago</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                                    <div className="size-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">New: Product Manager at StartupXYZ</span>
                                    <span className="ml-auto text-xs text-muted-foreground">5m ago</span>
                                </div>
                                <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                                    <div className="size-2 rounded-full bg-green-500"></div>
                                    <span className="text-sm">New: Sales Lead at GrowthCo</span>
                                    <span className="ml-auto text-xs text-muted-foreground">12m ago</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}
