'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Sparkles,
    Building2,
    Users,
    Clock,
    Target,
    RefreshCw,
} from 'lucide-react'
import type { AIInsights } from '@/lib/mock-ai-content'

interface AIInsightsSectionProps {
    insights: AIInsights
    className?: string
    onRegenerate?: () => void
    isRegenerating?: boolean
}

function InsightCard({
    icon: Icon,
    title,
    items,
    variant = 'default',
}: {
    icon: React.ElementType
    title: string
    items: string[]
    variant?: 'default' | 'accent' | 'warning'
}) {
    const variantStyles = {
        default: {
            card: 'border-black/5 bg-black/[0.01] dark:border-white/5 dark:bg-white/[0.01]',
            icon: 'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60',
        },
        accent: {
            card: 'border-black/10 bg-[#F8F7FF] dark:border-white/10 dark:bg-white/5',
            icon: 'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60',
        },
        warning: {
            card: 'border-black/10 bg-amber-50 dark:border-white/10 dark:bg-amber-500/10',
            icon: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
        },
    }

    const styles = variantStyles[variant]

    return (
        <div className={cn('rounded-lg border p-3', styles.card)}>
            <div className="flex items-start gap-2.5">
                <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', styles.icon)}>
                    <Icon className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium text-black dark:text-white">{title}</h4>
                    <ul className="mt-1.5 space-y-1">
                        {items.map((item, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-1.5 text-[11px] leading-relaxed text-black/60 dark:text-white/60"
                            >
                                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/20 dark:bg-white/20" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export function AIInsightsSection({ insights, className, onRegenerate, isRegenerating }: AIInsightsSectionProps) {
    return (
        <div className={cn('space-y-3', className)}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                    <div className="flex size-6 items-center justify-center rounded-lg bg-white dark:bg-[#0a0a0f]">
                        <Sparkles className="size-3 text-black/60 dark:text-white/60" />
                    </div>
                </div>
                <span className="text-xs font-medium text-black dark:text-white">
                    AI-Generated Insights
                </span>
                <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-black/50 dark:bg-white/10 dark:text-white/50">
                    GPT-4o mini
                </span>
                {onRegenerate && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRegenerate}
                        disabled={isRegenerating}
                        className="ml-auto h-6 px-2 text-[10px]"
                    >
                        <RefreshCw className={cn('mr-1 size-3', isRegenerating && 'animate-spin')} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                )}
            </div>

            {/* Company Facts */}
            {insights.companyFacts.length > 0 && (
                <InsightCard
                    icon={Building2}
                    title="Company Facts"
                    items={insights.companyFacts}
                    variant="default"
                />
            )}

            {/* Decision Maker Insights */}
            {insights.decisionMakerInsights.length > 0 && (
                <InsightCard
                    icon={Users}
                    title="Decision Makers"
                    items={insights.decisionMakerInsights}
                    variant="default"
                />
            )}

            {/* Timing Signals */}
            {insights.timingSignals.length > 0 && (
                <InsightCard
                    icon={Clock}
                    title="Timing Signals"
                    items={insights.timingSignals}
                    variant="accent"
                />
            )}

            {/* Competitive Intel */}
            {insights.competitiveIntel && (
                <div className="rounded-lg border border-black/5 bg-black/[0.01] p-3 dark:border-white/5 dark:bg-white/[0.01]">
                    <div className="flex items-start gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/10">
                            <Target className="size-3.5 text-black/60 dark:text-white/60" />
                        </div>
                        <div>
                            <h4 className="text-xs font-medium text-black dark:text-white">
                                Competitive Intelligence
                            </h4>
                            <p className="mt-1 text-[11px] leading-relaxed text-black/60 dark:text-white/60">
                                {insights.competitiveIntel}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
