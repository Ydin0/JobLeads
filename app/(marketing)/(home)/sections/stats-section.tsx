import { Map } from '@/components/map'

export function StatsSection() {
    return (
        <section className="bg-background">
            <div className="@container py-12 md:py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="mask-t-from-35% mask-b-from-75%">
                        <Map />
                    </div>
                    <div className="relative mx-auto max-w-3xl">
                        <span className="@2xl:block bg-border pointer-events-none absolute inset-y-4 left-1/3 hidden w-px"></span>
                        <span className="@2xl:block bg-border pointer-events-none absolute inset-y-4 left-2/3 hidden w-px"></span>
                        <div className="**:text-center @max-2xl:max-w-2xs @max-2xl:mx-auto @max-2xl:gap-6 @2xl:grid-cols-3 grid *:px-6">
                            <div className="space-y-4 *:block">
                                <span className="text-3xl font-semibold">
                                    50K <span className="text-muted-foreground text-lg">+</span>
                                </span>
                                <p className="text-muted-foreground text-balance text-sm">
                                    <strong className="text-foreground font-medium">Leads generated</strong> for recruitment agencies monthly.
                                </p>
                            </div>
                            <div className="space-y-4 *:block">
                                <span className="text-3xl font-semibold">
                                    20 <span className="text-muted-foreground text-lg">+</span>
                                </span>
                                <p className="text-muted-foreground text-balance text-sm">
                                    <strong className="text-foreground font-medium">Job boards</strong> scraped in real-time.
                                </p>
                            </div>
                            <div className="space-y-4 *:block">
                                <span className="text-3xl font-semibold">
                                    95 <span className="text-muted-foreground text-lg">%</span>
                                </span>
                                <p className="text-muted-foreground text-balance text-sm">
                                    <strong className="text-foreground font-medium">Email accuracy</strong> on enriched contacts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
