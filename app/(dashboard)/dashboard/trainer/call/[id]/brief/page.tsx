'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    User,
    MapPin,
    Users,
    Briefcase,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    MessageSquare,
    Target,
    TrendingUp,
    CheckCircle2,
    Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Mock briefing data
const mockBriefing = {
    company: {
        name: 'Acme Corporation',
        industry: 'Software Development',
        size: '201-500 employees',
        location: 'San Francisco, CA',
        logoUrl: null,
        keyFacts: [
            'Recently raised $50M Series B funding',
            'Expanding engineering team by 40% this quarter',
            'Currently using competitor product (SalesForce)',
            'Pain point: Manual data entry taking too much time',
            'Decision timeline: Q1 2025',
        ],
        hiringSignals: {
            totalJobs: 23,
            recentJobs: 8,
            departments: {
                engineering: 12,
                sales: 5,
                product: 4,
                marketing: 2,
            },
        },
    },
    contact: {
        name: 'Sarah Johnson',
        title: 'VP of Sales Operations',
        department: 'Sales',
        seniority: 'VP',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
        email: 'sarah.j@acme.com',
        personalityHints: [
            'Data-driven decision maker',
            'Values efficiency and ROI',
            'Prefers concise communication',
        ],
    },
    talkingPoints: [
        'Address their manual data entry pain point with our automation features',
        'Mention our integration capabilities with their existing tech stack',
        'Highlight ROI metrics from similar companies in their industry',
        'Discuss implementation timeline that aligns with their Q1 goals',
    ],
    script: `Hi Sarah, this is [Your Name] from RecLead. I noticed Acme is expanding your sales team significantly - congratulations on the growth!

[PAUSE - Let them respond]

The reason I'm reaching out is that we've helped similar fast-growing companies reduce their manual data entry by 80%, which typically saves sales teams about 10 hours per week.

[PAUSE]

I'd love to learn more about how your team currently handles lead management and see if there might be a fit. Do you have 15 minutes this week for a quick discovery call?`,
    objectionHandlers: [
        {
            objection: "We're already using Salesforce",
            response: "That's great - we actually integrate seamlessly with Salesforce. Our customers typically use us to enrich and qualify leads before they hit your CRM, which improves your data quality significantly.",
        },
        {
            objection: "We don't have budget right now",
            response: "I completely understand budget constraints. What we've seen is that companies like yours typically see a 3x ROI within the first quarter. Would it make sense to at least understand the potential savings so you can plan for next budget cycle?",
        },
        {
            objection: "I'm too busy right now",
            response: "I totally respect your time. Would it be helpful if I sent over a quick 2-minute video showing exactly how we've helped companies like Acme? That way you can review it when convenient.",
        },
        {
            objection: "Send me an email instead",
            response: "Absolutely, I'd be happy to. Just so I can make it relevant - what's your biggest challenge with lead management right now? That way I can include specific information that would be useful.",
        },
    ],
}

export default function BriefingPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const _mode = searchParams.get('mode') || 'random'
    void _mode // Will be used when mode affects display
    const callId = params.id as string

    const [isScriptExpanded, setIsScriptExpanded] = useState(false)
    const [expandedObjections, setExpandedObjections] = useState<number[]>([])

    const toggleObjection = (index: number) => {
        setExpandedObjections((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        )
    }

    const handleStartCall = () => {
        router.push(`/dashboard/trainer/call/${callId}/active`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard/trainer"
                    className="flex size-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-lg font-semibold text-black dark:text-white">
                        Call Briefing
                    </h1>
                    <p className="text-sm text-black/50 dark:text-white/50">
                        Review the details before starting your practice call
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                {/* Left Column - Company & Contact Info */}
                <div className="space-y-4 lg:col-span-3">
                    {/* Company Card */}
                    <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-start gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-500/10 dark:to-orange-500/10">
                                <Building2 className="size-7 text-rose-400 dark:text-rose-300" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-black dark:text-white">
                                    {mockBriefing.company.name}
                                </h2>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-black/50 dark:text-white/50">
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="size-3.5" />
                                        {mockBriefing.company.industry}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="size-3.5" />
                                        {mockBriefing.company.size}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="size-3.5" />
                                        {mockBriefing.company.location}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hiring Signals */}
                        <div className="mt-5 rounded-lg bg-gradient-to-r from-slate-50 to-slate-50/50 p-4 dark:from-white/[0.03] dark:to-white/[0.01]">
                            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                                <TrendingUp className="size-3" />
                                Hiring Signals
                            </div>
                            <div className="mt-3 flex items-center gap-6">
                                <div>
                                    <div className="text-3xl font-light tabular-nums text-black dark:text-white">
                                        {mockBriefing.company.hiringSignals.totalJobs}
                                    </div>
                                    <div className="text-xs text-black/50 dark:text-white/50">
                                        Open positions
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                                <div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="rounded-full bg-[#FEF3E7] px-2 py-0.5 text-sm font-medium text-[#E07D2A] dark:bg-orange-500/20 dark:text-orange-300">
                                            +{mockBriefing.company.hiringSignals.recentJobs} new
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-black/50 dark:text-white/50">
                                        Last 30 days
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(mockBriefing.company.hiringSignals.departments)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 3)
                                        .map(([dept, count]) => (
                                            <span
                                                key={dept}
                                                className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-medium capitalize text-black/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60"
                                            >
                                                {dept} ({count})
                                            </span>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Key Facts */}
                        <div className="mt-5">
                            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                                <Lightbulb className="size-3" />
                                Key Intelligence
                            </div>
                            <ul className="mt-3 space-y-2.5">
                                {mockBriefing.company.keyFacts.map((fact, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2.5 text-sm text-black/70 dark:text-white/70"
                                    >
                                        <span className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full bg-[#FEF3E7] dark:bg-orange-500/20">
                                            <span className="size-1.5 rounded-full bg-[#E07D2A] dark:bg-orange-400" />
                                        </span>
                                        {fact}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Contact Card */}
                    <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-start gap-4">
                            {/* Avatar with gradient ring like Contra */}
                            <div className="relative shrink-0">
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-rose-200 via-purple-200 to-violet-200 dark:from-rose-400/30 dark:via-purple-400/30 dark:to-violet-400/30" />
                                <div className="relative flex size-14 items-center justify-center rounded-full bg-white dark:bg-[#0a0a0f]">
                                    <User className="size-7 text-black/40 dark:text-white/40" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold text-black dark:text-white">
                                        {mockBriefing.contact.name}
                                    </h3>
                                    {mockBriefing.contact.linkedinUrl && (
                                        <a
                                            href={mockBriefing.contact.linkedinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-black/30 transition-colors hover:text-black dark:text-white/30 dark:hover:text-white"
                                        >
                                            <ExternalLink className="size-4" />
                                        </a>
                                    )}
                                </div>
                                <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
                                    {mockBriefing.contact.title}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded-full bg-[#FEF3E7] px-2.5 py-0.5 text-[10px] font-medium text-[#E07D2A] dark:bg-orange-500/20 dark:text-orange-300">
                                        {mockBriefing.contact.department}
                                    </span>
                                    <span className="rounded-full bg-[#EDE9FE] px-2.5 py-0.5 text-[10px] font-medium text-[#7C3AED] dark:bg-purple-500/20 dark:text-purple-300">
                                        {mockBriefing.contact.seniority}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {mockBriefing.contact.personalityHints && (
                            <div className="mt-4 rounded-lg bg-gradient-to-r from-slate-50 to-slate-50/50 p-4 dark:from-white/[0.03] dark:to-white/[0.01]">
                                <div className="text-[10px] font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                                    Personality Insights
                                </div>
                                <ul className="mt-2.5 space-y-2">
                                    {mockBriefing.contact.personalityHints.map((hint, index) => (
                                        <li
                                            key={index}
                                            className="flex items-center gap-2 text-sm text-black/70 dark:text-white/70"
                                        >
                                            <CheckCircle2 className="size-4 text-emerald-500" />
                                            {hint}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Talking Points */}
                    <div className="rounded-xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <Target className="size-4 text-black/40 dark:text-white/40" />
                            <h3 className="text-sm font-semibold text-black dark:text-white">
                                Talking Points
                            </h3>
                            <span className="rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-medium text-[#7C3AED] dark:bg-purple-500/20 dark:text-purple-300">
                                {mockBriefing.talkingPoints.length} points
                            </span>
                        </div>
                        <ul className="mt-4 space-y-3">
                            {mockBriefing.talkingPoints.map((point, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-orange-100 text-xs font-semibold text-[#E07D2A] dark:from-rose-500/20 dark:to-orange-500/20 dark:text-orange-300">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                        {point}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Column - Script & Objections */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Call Script */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <button
                            onClick={() => setIsScriptExpanded(!isScriptExpanded)}
                            className="flex w-full items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="size-4 text-black/40 dark:text-white/40" />
                                <h3 className="text-sm font-semibold text-black dark:text-white">
                                    Call Script
                                </h3>
                            </div>
                            {isScriptExpanded ? (
                                <ChevronUp className="size-4 text-black/40 dark:text-white/40" />
                            ) : (
                                <ChevronDown className="size-4 text-black/40 dark:text-white/40" />
                            )}
                        </button>
                        {isScriptExpanded && (
                            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gradient-to-r from-slate-50 to-slate-50/50 p-4 text-sm leading-relaxed text-black/70 dark:from-white/[0.03] dark:to-white/[0.01] dark:text-white/70">
                                {mockBriefing.script}
                            </div>
                        )}
                    </div>

                    {/* Objection Handlers */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="size-4 text-black/40 dark:text-white/40" />
                            <h3 className="text-sm font-semibold text-black dark:text-white">
                                Objection Handlers
                            </h3>
                            <span className="rounded-full bg-[#FEF3E7] px-2 py-0.5 text-[10px] font-medium text-[#E07D2A] dark:bg-orange-500/20 dark:text-orange-300">
                                {mockBriefing.objectionHandlers.length} responses
                            </span>
                        </div>
                        <div className="mt-4 space-y-2">
                            {mockBriefing.objectionHandlers.map((handler, index) => (
                                <div
                                    key={index}
                                    className="overflow-hidden rounded-lg border border-black/5 dark:border-white/5"
                                >
                                    <button
                                        onClick={() => toggleObjection(index)}
                                        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                    >
                                        <span className="text-sm font-medium text-black dark:text-white">
                                            &quot;{handler.objection}&quot;
                                        </span>
                                        {expandedObjections.includes(index) ? (
                                            <ChevronUp className="size-4 shrink-0 text-black/40 dark:text-white/40" />
                                        ) : (
                                            <ChevronDown className="size-4 shrink-0 text-black/40 dark:text-white/40" />
                                        )}
                                    </button>
                                    {expandedObjections.includes(index) && (
                                        <div className="border-t border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                            <p className="text-sm leading-relaxed text-black/70 dark:text-white/70">
                                                {handler.response}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Start Call Button - with gradient wrapper */}
                    <div className="rounded-full bg-gradient-to-r from-rose-200/60 via-purple-200/60 to-violet-200/60 p-px dark:from-rose-400/20 dark:via-purple-400/20 dark:to-violet-400/20">
                        <Button
                            onClick={handleStartCall}
                            className="h-12 w-full rounded-full bg-black text-base font-medium text-white hover:bg-black/90 dark:bg-[#0a0a0f] dark:hover:bg-black"
                        >
                            <Sparkles className="mr-2 size-4" />
                            Start Practice Call
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
