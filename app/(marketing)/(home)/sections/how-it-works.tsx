import { cn } from '@/lib/utils'
import { Search, Users, Send } from 'lucide-react'

export function HowItWorks() {
    return (
        <section className="bg-background @container">
            <div className="py-24">
                <div className="mx-auto w-full max-w-5xl px-6 xl:px-0">
                    <div className="@4xl:text-left text-center">
                        <h2 className="text-foreground text-3xl font-semibold">How RecLead Works</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">
                            Our streamlined three-step process turns job postings into <span className="text-foreground">qualified leads</span> for your recruitment agency.
                        </p>
                    </div>
                    <div className="@max-4xl:max-w-sm relative mx-auto mt-12">
                        <PlusDecorator className="-translate-[calc(50%-0.5px)]" />
                        <PlusDecorator className="right-0 -translate-y-[calc(50%-0.5px)] translate-x-[calc(50%-0.5px)]" />
                        <PlusDecorator className="bottom-0 right-0 translate-x-[calc(50%-0.5px)] translate-y-[calc(50%-0.5px)]" />
                        <PlusDecorator className="bottom-0 -translate-x-[calc(50%-0.5px)] translate-y-[calc(50%-0.5px)]" />
                        <div className="@4xl:grid-cols-3 @4xl:divide-x @max-4xl:divide-y grid overflow-hidden border [--color-border:color-mix(in_oklab,var(--color-foreground)10%,transparent)] [--color-card:color-mix(in_oklab,var(--color-muted)15%,var(--color-background))] *:p-8">
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div
                                    aria-hidden
                                    className="relative flex flex-col justify-end">
                                    <Counter number={1} />
                                    <SearchIllustration />
                                </div>
                                <div>
                                    <h3 className="text-foreground font-semibold">Set Your Search Criteria</h3>
                                    <p className="text-muted-foreground mt-2">Define target industries, locations, company sizes, and job titles. Save searches for reuse.</p>
                                </div>
                            </div>
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div
                                    aria-hidden
                                    className="relative flex flex-col justify-end">
                                    <Counter number={2} />
                                    <EnrichIllustration />
                                </div>

                                <div>
                                    <h3 className="text-foreground font-semibold">We Scrape & Enrich</h3>
                                    <p className="text-muted-foreground mt-2">Our system scrapes job boards and enriches each lead with verified contact information.</p>
                                </div>
                            </div>
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div
                                    aria-hidden
                                    className="relative flex flex-col justify-center">
                                    <Counter number={3} />
                                    <CRMIllustration />
                                </div>

                                <div className="@4xl:mt-0 mt-8">
                                    <h3 className="text-foreground font-semibold">Leads Pushed to CRM</h3>
                                    <p className="text-muted-foreground mt-2">Qualified leads are automatically pushed to your CRM, ready for outreach.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

const PlusDecorator = ({ className }: { className?: string }) => (
    <div
        aria-hidden
        className={cn('mask-radial-from-15% before:bg-foreground/25 after:bg-foreground/25 absolute size-3 before:absolute before:inset-0 before:m-auto before:h-px after:absolute after:inset-0 after:m-auto after:w-px', className)}
    />
)

const Counter = ({ number }: { number: number }) => (
    <div className="text-foreground mask-y-from-55% mask-x-from-55% @4xl:absolute top-0 flex size-6 -translate-x-1/3 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full font-mono text-sm before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_0.5px,transparent_0.5px,transparent_3px)] before:opacity-35">
        {number}
    </div>
)

const SearchIllustration = () => (
    <div className="relative">
        <div className="absolute inset-1/3 m-auto aspect-video rounded-full bg-zinc-500/20 blur-3xl"></div>
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Search className="size-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Search criteria</span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Industry:</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">Technology</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Location:</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">USA</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">Size:</span>
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs">50-200</span>
                </div>
            </div>
        </div>
    </div>
)

const EnrichIllustration = () => (
    <div className="relative">
        <div className="absolute inset-1/3 m-auto aspect-video rounded-full bg-zinc-500/20 blur-3xl"></div>
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Users className="size-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">Enriched lead</span>
            </div>
            <div className="space-y-2">
                <div className="h-2 w-3/4 rounded bg-zinc-700"></div>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-zinc-400">Email verified</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-zinc-400">Phone found</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-zinc-400">LinkedIn matched</span>
                </div>
            </div>
        </div>
    </div>
)

const CRMIllustration = () => (
    <div className="relative">
        <div className="absolute inset-1/3 m-auto aspect-video rounded-full bg-zinc-500/20 blur-3xl"></div>
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <div className="mb-3 flex items-center gap-2">
                <Send className="size-4 text-zinc-400" />
                <span className="text-sm text-zinc-400">CRM sync</span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between rounded bg-zinc-800/50 px-2 py-1">
                    <span className="text-xs">TechCorp Inc.</span>
                    <span className="text-xs text-green-400">Synced</span>
                </div>
                <div className="flex items-center justify-between rounded bg-zinc-800/50 px-2 py-1">
                    <span className="text-xs">StartupXYZ</span>
                    <span className="text-xs text-green-400">Synced</span>
                </div>
                <div className="flex items-center justify-between rounded bg-zinc-800/50 px-2 py-1">
                    <span className="text-xs">GrowthCo</span>
                    <span className="text-xs text-yellow-400">Pending</span>
                </div>
            </div>
        </div>
    </div>
)
