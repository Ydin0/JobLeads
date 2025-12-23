'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    User,
    Clock,
    Play,
    Pause,
    Download,
    MessageSquare,
    Lightbulb,
    Calendar,
    Headphones,
    CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface TranscriptEntry {
    timestamp: number
    speaker: 'agent' | 'ai'
    text: string
    sentiment: 'positive' | 'neutral' | 'negative'
    annotation?: string
}

// Mock call detail data
const mockCallDetail: {
    id: string
    agentName: string
    companyName: string
    contactName: string
    contactTitle: string
    duration: number
    mode: 'random' | 'manual'
    difficulty: 'easy' | 'medium' | 'hard'
    createdAt: Date
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
    recordingUrl: string
} = {
    id: '1',
    agentName: 'You',
    companyName: 'Acme Corporation',
    contactName: 'Sarah Johnson',
    contactTitle: 'VP of Sales Operations',
    duration: 312,
    mode: 'random' as const,
    difficulty: 'medium' as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    overallScore: 85,
    scores: {
        engagement: 88,
        objectionHandling: 82,
        productKnowledge: 90,
        callFlow: 80,
        meetingLikelihood: 85,
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
            annotation: 'Strong value proposition',
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
            annotation: 'Excellent objection handling',
        },
    ],
    improvementTips: [
        "Consider pausing longer after your value proposition to let the prospect respond",
        "When handling the Salesforce objection, you could also mention specific ROI numbers",
        "Good job redirecting the pricing question to discovery - keep doing this",
    ],
    recordingUrl: '/mock-recording.mp3',
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

function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

function CircularScore({ score, size = 100 }: { score: number; size?: number }) {
    const strokeWidth = 5
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
                <span className="text-2xl font-semibold text-black dark:text-white">
                    {score}%
                </span>
            </div>
        </div>
    )
}

export default function CallDetailPage() {
    const params = useParams()
    const callId = params.id as string
    const [isPlaying, setIsPlaying] = useState(false)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/trainer/history"
                        className="flex size-8 items-center justify-center rounded-full border border-black/10 text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <ArrowLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-black dark:text-white">
                            Call Details
                        </h1>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-black/50 dark:text-white/50">
                            <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formatDate(mockCallDetail.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatDuration(mockCallDetail.duration)}
                            </span>
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium capitalize text-black/60 dark:bg-white/5 dark:text-white/60">
                                {mockCallDetail.mode}
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                >
                    <Download className="mr-1.5 size-3.5" />
                    Download
                </Button>
            </div>

            {/* Company & Contact Info */}
            <div className="flex items-center gap-6 rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                        <Building2 className="size-4 text-black/40 dark:text-white/40" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-black dark:text-white">
                            {mockCallDetail.companyName}
                        </div>
                        <div className="text-[11px] text-black/50 dark:text-white/50">Company</div>
                    </div>
                </div>
                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <User className="size-4 text-black/40 dark:text-white/40" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-black dark:text-white">
                            {mockCallDetail.contactName}
                        </div>
                        <div className="text-[11px] text-black/50 dark:text-white/50">
                            {mockCallDetail.contactTitle}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Left Column - Scores & Transcript */}
                <div className="space-y-4 lg:col-span-2">
                    {/* Score Overview */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-5">
                            <CircularScore score={mockCallDetail.overallScore} />
                            <div className="flex-1">
                                <h2 className="text-sm font-semibold text-black dark:text-white">
                                    {mockCallDetail.overallScore >= 80
                                        ? 'Excellent Performance'
                                        : mockCallDetail.overallScore >= 60
                                          ? 'Good Job'
                                          : 'Keep Practicing'}
                                </h2>
                                <div className="mt-3 grid grid-cols-5 gap-3">
                                    {[
                                        { key: 'engagement', label: 'Engage' },
                                        { key: 'objectionHandling', label: 'Objections' },
                                        { key: 'productKnowledge', label: 'Knowledge' },
                                        { key: 'callFlow', label: 'Flow' },
                                        { key: 'meetingLikelihood', label: 'Meeting' },
                                    ].map(({ key, label }) => {
                                        const score = mockCallDetail.scores[key as keyof typeof mockCallDetail.scores]
                                        return (
                                            <div key={key} className="text-center">
                                                <div className={cn(
                                                    'text-sm font-medium tabular-nums',
                                                    score >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
                                                    score >= 70 ? 'text-black/70 dark:text-white/70' :
                                                    'text-orange-500 dark:text-orange-400'
                                                )}>
                                                    {score}
                                                </div>
                                                <div className="mt-0.5 text-[10px] text-black/40 dark:text-white/40">
                                                    {label}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Audio Player */}
                    <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="flex size-10 items-center justify-center rounded-full bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                            >
                                {isPlaying ? (
                                    <Pause className="size-4" />
                                ) : (
                                    <Play className="ml-0.5 size-4" />
                                )}
                            </button>
                            <div className="flex-1">
                                <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5">
                                    <div
                                        className="h-full rounded-full bg-black/30 dark:bg-white/30"
                                        style={{ width: '35%' }}
                                    />
                                </div>
                                <div className="mt-1 flex justify-between text-[11px] text-black/40 dark:text-white/40">
                                    <span>1:49</span>
                                    <span>{formatDuration(mockCallDetail.duration)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transcript */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                            <MessageSquare className="size-4 text-black/40 dark:text-white/40" />
                            Call Transcript
                        </h3>

                        <div className="mt-4 space-y-4">
                            {mockCallDetail.transcript.map((entry, index) => (
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
                                                {entry.speaker === 'agent' ? mockCallDetail.agentName : 'Prospect'}
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

                {/* Right Column - Tips */}
                <div className="space-y-4">
                    {/* Improvement Tips */}
                    <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.02]">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-black dark:text-white">
                            <Lightbulb className="size-4 text-black/40 dark:text-white/40" />
                            Improvement Tips
                        </h3>

                        <ul className="mt-4 space-y-3">
                            {mockCallDetail.improvementTips.map((tip, index) => (
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
                        <Link href={`/dashboard/trainer/call/${callId}/brief?mode=retry`}>
                            <Button className="h-10 w-full rounded-full bg-black text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                <Headphones className="mr-2 size-4" />
                                Practice Again
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
