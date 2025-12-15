'use client'

import { Button } from '@/components/ui/button'
import { X, Check, Sparkles, Zap, Building2, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentPlan?: string
}

const plans = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        period: '',
        credits: 30,
        icon: Sparkles,
        color: 'from-gray-500 to-gray-600',
        features: [
            '30 credits/month',
            '1 active search',
            'Basic job scraping',
            'Email support',
        ],
    },
    {
        id: 'starter',
        name: 'Starter',
        price: '$79',
        period: '/mo',
        credits: 150,
        icon: Zap,
        color: 'from-blue-500 to-cyan-500',
        features: [
            '150 credits/month',
            '5 active searches',
            'CSV export',
            'Priority email support',
            'Search scheduling',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$199',
        period: '/mo',
        credits: 500,
        icon: Building2,
        color: 'from-purple-500 to-pink-500',
        popular: true,
        features: [
            '500 credits/month',
            'Unlimited searches',
            'Up to 5 team members',
            'CRM integrations',
            'Priority support',
            'Advanced filters',
        ],
    },
    {
        id: 'business',
        name: 'Business',
        price: '$499',
        period: '/mo',
        credits: 1500,
        icon: Crown,
        color: 'from-orange-500 to-amber-500',
        features: [
            '1,500 credits/month',
            'Unlimited searches',
            'Unlimited team members',
            'Custom integrations',
            'Dedicated support',
            'API access',
            'Custom branding',
        ],
    },
]

export function PricingModal({ open, onOpenChange, currentPlan = 'free' }: PricingModalProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f]/90 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-32 -top-32 size-64 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -right-32 -top-32 size-64 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-5">
                    <div>
                        <h2 className="text-xl font-semibold text-white">Upgrade Your Plan</h2>
                        <p className="text-sm text-white/40">Choose the plan that works best for you</p>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Plans Grid */}
                <div className="relative px-6 pb-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {plans.map((plan) => {
                            const isCurrentPlan = currentPlan === plan.id
                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        'group relative flex flex-col rounded-xl border p-4 transition-all duration-300',
                                        plan.popular
                                            ? 'border-purple-500/30 bg-gradient-to-b from-purple-500/10 to-transparent'
                                            : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]',
                                        isCurrentPlan && 'ring-1 ring-white/20'
                                    )}>
                                    {/* Popular badge */}
                                    {plan.popular && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                                            <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-0.5 text-[10px] font-medium text-white shadow-lg shadow-purple-500/25">
                                                Most Popular
                                            </span>
                                        </div>
                                    )}

                                    {/* Icon & Name */}
                                    <div className="mb-3 flex items-center gap-3">
                                        <div className={cn(
                                            'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                            plan.color
                                        )}>
                                            <plan.icon className="size-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-3">
                                        <span className="text-2xl font-bold text-white">{plan.price}</span>
                                        <span className="text-xs text-white/40">{plan.period}</span>
                                    </div>

                                    {/* Credits */}
                                    <div className="mb-3 rounded-lg bg-white/5 px-3 py-1.5">
                                        <div className="text-xs font-medium text-white/80">{plan.credits} credits/mo</div>
                                        <div className="text-[10px] text-white/40">~{Math.floor(plan.credits / 3)} company enrichments</div>
                                    </div>

                                    {/* Features */}
                                    <div className="mb-4 flex-1 space-y-1.5">
                                        {plan.features.map((feature) => (
                                            <div key={feature} className="flex items-center gap-2 text-xs">
                                                <Check className="size-3 shrink-0 text-green-400" />
                                                <span className="text-white/60">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    {isCurrentPlan ? (
                                        <div className="rounded-lg border border-white/10 bg-white/5 py-2.5 text-center text-sm font-medium text-white/40">
                                            Current Plan
                                        </div>
                                    ) : plan.id === 'free' ? (
                                        <div className="rounded-lg border border-white/5 py-2.5 text-center text-sm font-medium text-white/20">
                                            Free Forever
                                        </div>
                                    ) : (
                                        <Button
                                            className={cn(
                                                'h-9 w-full text-sm',
                                                plan.popular
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:from-purple-600 hover:to-pink-600'
                                                    : 'bg-white text-black hover:bg-white/90'
                                            )}>
                                            Upgrade to {plan.name}
                                        </Button>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer note */}
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5">
                        <p className="text-xs text-white/40">
                            All plans include unlimited job searches. Additional credits at $0.75 each.
                        </p>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="text-xs font-medium text-white/40 transition-colors hover:text-white/60">
                            Maybe Later
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
