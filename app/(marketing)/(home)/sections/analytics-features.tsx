import { CalendarDays, Clock2, Zap } from 'lucide-react'
import { ChartIllustration } from '@/components/illustrations/chart-illustration'
import { Card } from '@/components/ui/card'
import { AiOverviewIllustration } from '@/components/illustrations/ai-overview-illustration'
import { LanguagesIllustration } from '@/components/illustrations/languages-illustration'
import { LinkPaymentIllustration } from '@/components/illustrations/link-payment-illustration'

export function AnalyticsFeatures() {
    return (
        <section className="@container py-16">
            <div className="mx-auto max-w-5xl px-6">
                <div className="grid items-end gap-6 md:grid-cols-2">
                    <h2 className="text-foreground text-4xl font-semibold md:text-5xl">Built to power your pricings in the AI era</h2>
                    <div className="lg:pl-12">
                        <p className="text-muted-foreground text-balance">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                    </div>
                </div>

                <div className="@4xl:grid-cols-6 mt-16 grid gap-2 *:shadow-lg *:shadow-black/5 lg:-mx-8">
                    <Card className="@4xl:col-span-3 row-span-2 grid grid-rows-subgrid gap-8">
                        <div className="px-8 pt-8">
                            <h3 className="text-balance font-semibold">Pricing performance analytics</h3>
                            <p className="text-muted-foreground mt-3">Monitor conversion rate, ARPU, and churn with real-time cohort charts and device breakdowns to optimize plans.</p>
                        </div>
                        <div className="self-end pb-4">
                            <ChartIllustration />
                        </div>
                    </Card>
                    <Card className="@4xl:col-span-3 row-span-2 grid grid-rows-subgrid gap-8">
                        <div className="relative z-10 px-8 pt-8">
                            <h3 className="text-balance font-semibold">AI pricing overviews</h3>
                            <p className="text-muted-foreground mt-3">Get AI-generated summaries of what&apos;s working, plus suggested experiments, copy, and layout tweaks for each plan.</p>
                        </div>
                        <div className="self-end px-8 pb-8">
                            <AiOverviewIllustration />
                        </div>
                    </Card>
                    <Card className="@4xl:col-span-2 row-span-2 grid grid-rows-subgrid gap-8">
                        <div className="relative z-10 px-8 pt-8">
                            <h3 className="text-balance font-semibold">Localized pricing at scale</h3>
                            <p className="text-muted-foreground mt-3">Auto-translate plans and regional messaging into 100+ languages with currency and locale-aware formatting.</p>
                        </div>
                        <div className="self-end px-8 pb-8">
                            <LanguagesIllustration />
                        </div>
                    </Card>
                    <Card className="@4xl:col-span-4 row-span-2 grid grid-rows-subgrid">
                        <div className="relative z-10 px-8 pt-8">
                            <h3 className="text-balance font-semibold">One-click checkout links</h3>
                            <p className="text-muted-foreground mt-3">Share secure payment links that remember saved details and verify via code for frictionless, high-converting checkout.</p>
                        </div>
                        <div className="self-end px-8 pb-8">
                            <LinkPaymentIllustration />
                        </div>
                    </Card>
                </div>

                <div className="@4xl:gap-12 @4xl:grid-cols-3 relative mt-16 grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <Clock2 className="fill-foreground/10 size-4" />
                        <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                    </div>
                    <div className="space-y-1.5">
                        <Zap className="fill-foreground/10 size-4" />
                        <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                    </div>
                    <div className="space-y-1.5">
                        <CalendarDays className="fill-foreground/10 size-4" />
                        <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                    </div>
                    <div className="space-y-1.5 md:hidden">
                        <CalendarDays className="fill-foreground/10 size-4" />
                        <h3 className="mt-3 font-medium">Speed Is Everything</h3>
                        <p className="text-muted-foreground line-clamp-2 text-sm">Tailark is a fast and efficient AI-powered code editor that can help you write code faster and more efficiently.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}