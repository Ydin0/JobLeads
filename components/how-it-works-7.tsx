import { MemoryUsageIllustration } from "@/components/memory-usage-illustration"
import { CampaignIllustration } from "@/components/campaign-illustration"
import { cn } from '@/lib/utils'
import { PollIllustration } from "@/components/poll-illustration"

export default function HowItWorksSeven() {
    return (
        <section
            data-theme="dark"
            className="bg-background @container">
            <div className="py-24 [--color-primary:var(--color-emerald-300)]">
                <div className="mx-auto w-full max-w-5xl px-6 xl:px-0">
                    <div className="@4xl:text-left text-center">
                        <h2 className="text-foreground text-3xl font-semibold">Simple Three-Step Workflow</h2>
                        <p className="text-muted-foreground mt-4 text-balance text-lg">
                            Experience our streamlined approach to data analysis that empowers your team to make <span className="text-foreground">informed decisions</span> quickly and efficiently.
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
                                    <CampaignIllustration />
                                </div>
                                <div>
                                    <h3 className="text-foreground font-semibold">Secure Messaging</h3>
                                    <p className="text-muted-foreground mt-2">End-to-end encrypted communications for enterprise.</p>
                                </div>
                            </div>
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div
                                    aria-hidden
                                    className="relative flex flex-col justify-end">
                                    <Counter number={2} />
                                    <div className="relative">
                                        <div className="bg-linear-to-br/increasing from-primary absolute inset-1/3 m-auto aspect-video rounded-full to-indigo-500 blur-3xl"></div>
                                        <div className="mask-y-from-55% mask-r-from-55% absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:2px_2px]"></div>
                                        <PollIllustration />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-foreground font-semibold">Analytics Dashboard</h3>
                                    <p className="text-muted-foreground mt-2">Data visualization tools to transform complex metrics into insights.</p>
                                </div>
                            </div>
                            <div className="row-span-2 grid grid-rows-subgrid gap-8">
                                <div
                                    aria-hidden
                                    className="relative flex flex-col justify-center">
                                    <Counter number={3} />
                                    <MemoryUsageIllustration />
                                </div>

                                <div className="@4xl:mt-0 mt-8">
                                    <h3 className="text-foreground font-semibold">Resource Monitoring</h3>
                                    <p className="text-muted-foreground mt-2">Real-time tracking of system performance to optimize efficiency.</p>
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

const Counter = ({ number }: { number: number }) => <div className="text-foreground mask-y-from-55% mask-x-from-55% @4xl:absolute top-0 flex size-6 -translate-x-1/3 -translate-y-1/2 items-center justify-center overflow-hidden rounded-full font-mono text-sm before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_0.5px,transparent_0.5px,transparent_3px)] before:opacity-35">{number}</div>