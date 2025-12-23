'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Trophy,
    TrendingUp,
    MessageSquare,
    Lightbulb,
    Target,
    Users,
    Play,
    RotateCcw,
    History,
    Clock,
    CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface TranscriptEntry {
    timestamp: number
    speaker: 'agent' | 'ai'
    text: string
    sentiment: 'positive' | 'neutral' | 'negative'
    annotation?: string
}

// Mock results data
const mockResults: {
    callId: string
    companyName: string
    contactName: string
    contactTitle: string
    duration: number
    overallScore: number
    scores: {
        engagement: number
        objectionHandling: number
        productKnowledge: number
        callFlow: number
        meetingLikelihood: number
    }
    transcript: TranscriptEntry[]
    improvementTips: string[]
} = {
    callId: '1',
    companyName: 'Acme Corporation',
    contactName: 'Sarah Johnson',
    contactTitle: 'VP of Sales Operations',
    duration: 312,
    overallScore: 78,
    scores: {
        engagement: 82,
        objectionHandling: 71,
        productKnowledge: 85,
        callFlow: 74,
        meetingLikelihood: 78,
    },
    transcript: [
        {
            timestamp: 0,
            speaker: 'agent',
            text: "Hi Sarah, this is Alex from RecLead. I noticed Acme is expanding your sales team significantly - congratulations on the growth!",
            sentiment: 'positive',
        },
        {
            timestamp: 8,
            speaker: 'ai',
            text: "Oh, thanks! Yes, it's been quite busy. How can I help you today?",
            sentiment: 'neutral',
        },
        {
            timestamp: 15,
            speaker: 'agent',
            text: "The reason I'm reaching out is that we've helped similar fast-growing companies reduce their manual data entry by 80%, which typically saves sales teams about 10 hours per week.",
            sentiment: 'positive',
            annotation: 'Good value proposition',
        },
        {
            timestamp: 28,
            speaker: 'ai',
            text: "That sounds interesting, but we're already using Salesforce for our CRM needs.",
            sentiment: 'neutral',
        },
        {
            timestamp: 35,
            speaker: 'agent',
            text: "That's great - we actually integrate seamlessly with Salesforce. Our customers typically use us to enrich and qualify leads before they hit your CRM.",
            sentiment: 'positive',
            annotation: 'Good objection handling',
        },
        {
            timestamp: 48,
            speaker: 'ai',
            text: "Hmm, I see. How much does this cost?",
            sentiment: 'neutral',
        },
        {
            timestamp: 52,
            speaker: 'agent',
            text: "The pricing depends on your team size and usage, but I'd love to first understand your current challenges to see if there's a fit. What's your biggest pain point with lead management right now?",
            sentiment: 'positive',
            annotation: 'Good redirect to discovery',
        },
    ],
    improvementTips: [
        "Consider pausing longer after your value proposition to let the prospect respond",
        "When handling the Salesforce objection, you could also mention specific ROI numbers",
        "Good job redirecting the pricing question to discovery - keep doing this",
        "Try to ask more open-ended questions to understand their pain points better",
        "Your tone was confident but friendly - maintain this energy throughout",
    ],
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Circular progress component
function CircularScore({ score, size = 120 }: { score: number; size?: number }) {
    const strokeWidth = 6
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (score / 100) * circumference

    // Color based on score
    const getScoreColor = () => {
        if (score >= 80) return 'stroke-emerald-500'
        if (score >= 60) return 'stroke-orange-400'
        return 'stroke-rose-400'
    }

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="rotate-[-90deg]" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-black/5 dark:text-white/5"
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={cn(getScoreColor(), 'transition-all duration-1000')}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold text-black dark:text-white">
                    {score}%
                </span>
                <span className="text-xs text-black/40 dark:text-white/40">Overall</span>
            </div>
        </div>
    )
}

export default function ResultsPage() {
    const params = useParams()
    const router = useRouter()
    const callId = params.id as string

    const handleTryAgain = () => {
        router.push(`/dashboard/trainer/call/${callId}/brief?mode=retry`)
    }

    const handleNewCall = () => {
        const newCallId = `call-${Date.now()}`
        router.push(`/dashboard/trainer/call/${newCallId}/brief?mode=random`)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/trainer"
                        className="flex size-8 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-black dark:text-white">
                            Call Results
                        </h1>
                        <p className="text-sm text-black/50 dark:text-white/50">
                            {mockResults.companyName} • {mockResults.contactName}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                    <Clock className="size-3.5" />
                    {formatDuration(mockResults.duration)}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Left Column - Scores */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Overall Score Card */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-6">
                            <CircularScore score={mockResults.overallScore} />

                            <div className="flex-1">
                                <h2 className="text-sm font-semibold text-black dark:text-white">
                                    {mockResults.overallScore >= 80
                                        ? 'Excellent Performance'
                                        : mockResults.overallScore >= 60
                                          ? 'Good Job'
                                          : mockResults.overallScore >= 40
                                            ? 'Room for Improvement'
                                            : 'Keep Practicing'}
                                </h2>
                                <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                                    {mockResults.overallScore >= 80
                                        ? "You handled this call like a pro."
                                        : mockResults.overallScore >= 60
                                          ? "Solid performance with some areas to polish."
                                          : "Focus on the improvement tips to boost your score."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                            <Target className="size-4 text-black/40 dark:text-white/40" />
                            Score Breakdown
                        </h3>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                { key: 'engagement', label: 'Engagement', icon: Users, description: 'How well you kept their interest' },
                                { key: 'objectionHandling', label: 'Objection Handling', icon: MessageSquare, description: 'Response to pushback' },
                                { key: 'productKnowledge', label: 'Product Knowledge', icon: Lightbulb, description: 'Accuracy of information' },
                                { key: 'callFlow', label: 'Call Flow', icon: TrendingUp, description: 'Natural conversation structure' },
                                { key: 'meetingLikelihood', label: 'Meeting Likelihood', icon: Trophy, description: 'Probability of conversion' },
                            ].map(({ key, label, icon: Icon, description }) => {
                                const score = mockResults.scores[key as keyof typeof mockResults.scores]
                                return (
                                    <div
                                        key={key}
                                        className="rounded-lg border border-black/5 p-3 dark:border-white/5"
                                    >
                                        <div className="flex items-center justify-between">
                                            <Icon className="size-4 text-black/40 dark:text-white/40" />
                                            <span className="text-lg font-semibold tabular-nums text-black/70 dark:text-white/70">
                                                {score}
                                            </span>
                                        </div>
                                        <div className="mt-2">
                                            <div className="text-xs font-medium text-black dark:text-white">
                                                {label}
                                            </div>
                                            <div className="text-[11px] text-black/40 dark:text-white/40">
                                                {description}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Transcript */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                            <MessageSquare className="size-4 text-black/40 dark:text-white/40" />
                            Call Transcript
                        </h3>

                        <div className="mt-4 space-y-4">
                            {mockResults.transcript.map((entry, index) => (
                                <div key={index} className="flex gap-3">
                                    <div className="w-10 shrink-0 text-[11px] tabular-nums text-black/40 dark:text-white/40">
                                        {formatTimestamp(entry.timestamp)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={cn(
                                                    'text-xs font-medium',
                                                    entry.speaker === 'agent'
                                                        ? 'text-black/70 dark:text-white/70'
                                                        : 'text-black/50 dark:text-white/50'
                                                )}
                                            >
                                                {entry.speaker === 'agent' ? 'You' : 'Prospect'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed text-black/60 dark:text-white/60">
                                            {entry.text}
                                        </p>
                                        {entry.annotation && (
                                            <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="size-3" />
                                                {entry.annotation}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Tips & Actions */}
                <div className="space-y-4">
                    {/* Improvement Tips */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                            <Lightbulb className="size-4 text-black/40 dark:text-white/40" />
                            Improvement Tips
                        </h3>

                        <ul className="mt-4 space-y-3">
                            {mockResults.improvementTips.map((tip, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-2 text-sm leading-relaxed text-black/60 dark:text-white/60"
                                >
                                    <span className="mt-2 size-1 shrink-0 rounded-full bg-black/30 dark:bg-white/30" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <Button
                            onClick={handleTryAgain}
                            className="h-10 w-full rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            <RotateCcw className="mr-2 size-4" />
                            Try Again
                        </Button>

                        <Button
                            onClick={handleNewCall}
                            variant="outline"
                            className="h-10 w-full rounded-full border-black/10 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                        >
                            <Play className="mr-2 size-4" />
                            New Random Call
                        </Button>

                        <Link href="/dashboard/trainer/history">
                            <Button
                                variant="ghost"
                                className="h-10 w-full rounded-full text-sm font-medium text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                <History className="mr-2 size-4" />
                                View History
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
