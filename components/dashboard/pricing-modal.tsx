'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Check, Target, Zap, Building2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentPlan?: string
}

const plans = [
    {
        id: 'basic',
        name: 'Basic',
        price: 89,
        icpTokens: 1000,
        enrichmentTokens: 200,
        features: [
            '1,000 ICP tokens/month',
            '200 enrichment tokens',
            'Basic filters',
            'CSV export',
            'Email support',
        ],
        popular: false,
        hasAI: false,
    },
    {
        id: 'advanced',
        name: 'Advanced',
        price: 249,
        icpTokens: 10000,
        enrichmentTokens: 650,
        features: [
            '10,000 ICP tokens/month',
            '650 enrichment tokens',
            'AI Assistant',
            'Advanced filters',
            'CRM integrations',
            'Priority support',
        ],
        popular: true,
        hasAI: true,
    },
    {
        id: 'premier',
        name: 'Premier',
        price: 599,
        icpTokens: 100000,
        enrichmentTokens: 1000,
        features: [
            '100,000 ICP tokens/month',
            '1,000 enrichment tokens',
            'AI Assistant',
            'Custom integrations',
            'Dedicated support',
            'API access',
        ],
        popular: false,
        hasAI: true,
    },
    {
        id: 'super',
        name: 'Super',
        price: 1000,
        icpTokens: 200000,
        enrichmentTokens: 2500,
        features: [
            '200,000 ICP tokens/month',
            '2,500 enrichment tokens',
            'AI Assistant',
            'White-label options',
            'SLA guarantee',
            'Custom onboarding',
        ],
        popular: false,
        hasAI: true,
    },
]

export function PricingModal({ open, onOpenChange, currentPlan = 'free' }: PricingModalProps) {
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

    if (!open) return null

    const handleUpgrade = () => {
        if (!selectedPlan) return
        // Handle upgrade logic - integrate with Stripe here
        console.log('Upgrading to:', selectedPlan, billingCycle)
        onOpenChange(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-6 py-5 dark:border-white/5">
                    <div>
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            Upgrade your plan
                        </h2>
                        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                            Get more tokens to find and enrich more leads
                        </p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center border-b border-black/5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-1 rounded-full bg-black/5 p-1 dark:bg-white/5">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={cn(
                                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                                billingCycle === 'monthly'
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={cn(
                                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                                billingCycle === 'yearly'
                                    ? "bg-black text-white dark:bg-white dark:text-black"
                                    : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
                            )}
                        >
                            Yearly
                            <span className={cn(
                                "rounded-full px-1.5 py-0.5 text-[10px]",
                                billingCycle === 'yearly'
                                    ? "bg-white/20 dark:bg-black/20"
                                    : "bg-black/10 dark:bg-white/10"
                            )}>
                                -20%
                            </span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid max-h-[400px] gap-4 overflow-y-auto p-6 sm:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.id
                        const isCurrent = currentPlan === plan.id
                        const price = billingCycle === 'yearly'
                            ? Math.round(plan.price * 0.8)
                            : plan.price

                        return (
                            <button
                                key={plan.id}
                                onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                                disabled={isCurrent}
                                className={cn(
                                    "relative flex flex-col rounded-xl border p-4 text-left transition-all",
                                    isSelected
                                        ? "border-black ring-1 ring-black dark:border-white dark:ring-white"
                                        : isCurrent
                                            ? "border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]"
                                            : "border-black/10 hover:border-black/20 dark:border-white/10 dark:hover:border-white/20"
                                )}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                        <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-medium text-white dark:bg-white dark:text-black">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Current Badge */}
                                {isCurrent && (
                                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                        <span className="rounded-full bg-black/10 px-2.5 py-1 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                            Current
                                        </span>
                                    </div>
                                )}

                                {/* Plan Name + AI Badge */}
                                <div className="mb-3 flex items-center gap-2">
                                    <h3 className="text-sm font-semibold text-black dark:text-white">
                                        {plan.name}
                                    </h3>
                                    {plan.hasAI && (
                                        <span className="flex items-center gap-0.5 rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                            <Sparkles className="size-2.5" />
                                            AI
                                        </span>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="mb-3">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold text-black dark:text-white">
                                            ${price}
                                        </span>
                                        <span className="text-xs text-black/40 dark:text-white/40">
                                            /mo
                                        </span>
                                    </div>
                                </div>

                                {/* Tokens Summary */}
                                <div className="mb-3 space-y-1.5 rounded-lg bg-black/[0.02] p-2.5 dark:bg-white/[0.02]">
                                    <div className="flex items-center gap-2">
                                        <Target className="size-3 text-black/40 dark:text-white/40" />
                                        <span className="text-[11px] text-black/70 dark:text-white/70">
                                            {plan.icpTokens.toLocaleString()} ICP tokens
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Zap className="size-3 text-black/40 dark:text-white/40" />
                                        <span className="text-[11px] text-black/70 dark:text-white/70">
                                            {plan.enrichmentTokens.toLocaleString()} enrichments
                                        </span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex-1 space-y-1.5">
                                    {plan.features.slice(2).map((feature, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Check className="mt-0.5 size-3 shrink-0 text-black/40 dark:text-white/40" />
                                            <span className="text-[11px] text-black/60 dark:text-white/60">
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <div className="mt-3 flex items-center justify-center">
                                        <div className="flex size-5 items-center justify-center rounded-full bg-black dark:bg-white">
                                            <Check className="size-3 text-white dark:text-black" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Enterprise CTA */}
                <div className="border-t border-black/5 px-6 py-4 dark:border-white/5">
                    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] px-4 py-3 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                                <Building2 className="size-4 text-black/60 dark:text-white/60" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-black dark:text-white">
                                    Enterprise
                                </p>
                                <p className="text-xs text-black/50 dark:text-white/50">
                                    Custom limits, dedicated support, and SLA
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="h-8 rounded-full border-black/20 px-4 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
                        >
                            Contact Sales
                        </Button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-black/5 bg-black/[0.02] px-6 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <p className="text-xs text-black/40 dark:text-white/40">
                        Cancel anytime. No questions asked.
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            onClick={handleUpgrade}
                            disabled={!selectedPlan}
                            className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            {selectedPlan ? `Upgrade to ${plans.find(p => p.id === selectedPlan)?.name}` : 'Select a plan'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
