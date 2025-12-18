'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Target,
    Building2,
    Users,
    Sparkles,
    ArrowRight,
    Zap,
    TrendingUp,
    Bell,
} from 'lucide-react'

const steps = [
    {
        icon: Target,
        title: 'Define your ICP',
        description: 'Tell us what you sell and AI will suggest the best hiring signals to track',
    },
    {
        icon: Building2,
        title: 'Discover companies',
        description: 'Find companies actively hiring for roles that indicate they need your product',
    },
    {
        icon: Users,
        title: 'Get decision makers',
        description: 'Enrich companies with contacts and export leads to your CRM',
    },
]

const features = [
    {
        icon: Zap,
        title: 'Trigger-based selling',
        description: 'Reach companies at the exact moment they need your product',
    },
    {
        icon: TrendingUp,
        title: 'Hiring velocity signals',
        description: 'Track hiring patterns to identify high-growth companies',
    },
    {
        icon: Bell,
        title: 'Real-time alerts',
        description: 'Get notified when new companies match your criteria',
    },
]

export default function OnboardingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleGetStarted = () => {
        setIsLoading(true)
        router.push('/onboarding/setup-icp')
    }

    return (
        <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 py-16">
            <div className="w-full max-w-3xl text-center">
                {/* Hero */}
                <div className="relative mb-12">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-inset ring-purple-500/20">
                        <Sparkles className="size-10 text-purple-400" />
                    </div>
                    <h1 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
                        Welcome to RecLead
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-lg text-white/50">
                        Find companies that are actively hiring for roles that indicate they need
                        your product. Turn job postings into sales opportunities.
                    </p>
                </div>

                {/* How it works */}
                <div className="mb-12">
                    <h2 className="mb-6 text-sm font-medium uppercase tracking-wider text-white/40">
                        How it works
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {steps.map((step, index) => (
                            <div
                                key={step.title}
                                className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-5"
                            >
                                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                                <div className="flex items-start gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-semibold text-purple-400">
                                        {index + 1}
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-medium text-white">{step.title}</h3>
                                        <p className="mt-1 text-sm text-white/40">
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div className="mb-12">
                    <div className="grid gap-4 sm:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4"
                            >
                                <feature.icon className="size-5 shrink-0 text-purple-400" />
                                <div className="text-left">
                                    <h3 className="text-sm font-medium text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-0.5 text-xs text-white/40">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <Button
                    size="lg"
                    onClick={handleGetStarted}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 px-8 text-white hover:from-purple-600 hover:to-blue-600"
                >
                    {isLoading ? (
                        <>
                            <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                            Loading...
                        </>
                    ) : (
                        <>
                            Create your first ICP
                            <ArrowRight className="ml-2 size-4" />
                        </>
                    )}
                </Button>
                <p className="mt-4 text-sm text-white/40">
                    It only takes 2 minutes to set up
                </p>
            </div>
        </div>
    )
}
