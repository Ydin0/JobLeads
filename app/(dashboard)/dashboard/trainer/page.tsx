'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Headphones,
    Play,
    Settings2,
    Clock,
    Trophy,
    Flame,
    TrendingUp,
    Building2,
    User,
    ChevronRight,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data for demo
const mockStats = {
    totalCalls: 24,
    avgScore: 73,
    bestScore: 92,
    practiceStreak: 5,
}

const mockRecentCalls = [
    {
        id: '1',
        companyName: 'Acme Corp',
        contactName: 'John Smith',
        contactTitle: 'VP of Engineering',
        duration: 312,
        score: 85,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
        id: '2',
        companyName: 'TechStart Inc',
        contactName: 'Sarah Johnson',
        contactTitle: 'Head of Product',
        duration: 245,
        score: 72,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: '3',
        companyName: 'DataFlow Systems',
        contactName: 'Mike Chen',
        contactTitle: 'CTO',
        duration: 0,
        score: 0,
        status: 'abandoned' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
        id: '4',
        companyName: 'CloudScale',
        contactName: 'Emily Davis',
        contactTitle: 'Director of Sales',
        duration: 428,
        score: 91,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: '5',
        companyName: 'InnovateTech',
        contactName: 'Alex Rivera',
        contactTitle: 'Engineering Manager',
        duration: 189,
        score: 68,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
        id: '6',
        companyName: 'NextGen Solutions',
        contactName: 'Rachel Park',
        contactTitle: 'VP of Operations',
        duration: 356,
        score: 88,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
    {
        id: '7',
        companyName: 'Quantum Labs',
        contactName: 'David Miller',
        contactTitle: 'Head of Engineering',
        duration: 267,
        score: 76,
        status: 'completed' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    },
]

function formatDuration(seconds: number): string {
    if (seconds === 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'text-black/70 dark:text-white/70'
    if (score >= 60) return 'text-black/60 dark:text-white/60'
    return 'text-black/50 dark:text-white/50'
}

export default function TrainerPage() {
    const router = useRouter()

    const handleRandomCall = () => {
        const callId = `call-${Date.now()}`
        router.push(`/dashboard/trainer/call/${callId}/brief?mode=random`)
    }

    const handleManualSetup = () => {
        router.push('/dashboard/trainer/setup')
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold text-black dark:text-white">
                    AI Trainer
                </h1>
                <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                    Practice sales calls with AI-powered simulations
                </p>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 border-b border-black/5 pb-6 dark:border-white/5">
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">
                        {mockStats.totalCalls}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-black/50 dark:text-white/50">
                        <Headphones className="size-3.5" />
                        Total Calls
                    </div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">
                        {mockStats.avgScore}%
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-black/50 dark:text-white/50">
                        <TrendingUp className="size-3.5" />
                        Avg Score
                    </div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">
                        {mockStats.bestScore}%
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-black/50 dark:text-white/50">
                        <Trophy className="size-3.5" />
                        Best Score
                    </div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">
                        {mockStats.practiceStreak}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-black/50 dark:text-white/50">
                        <Flame className="size-3.5" />
                        Day Streak
                    </div>
                </div>
            </div>

            {/* Quick Actions - Condensed */}
            <div className="grid gap-3 sm:grid-cols-2">
                {/* Random Call - Featured with gradient border */}
                <button
                    onClick={handleRandomCall}
                    className="group rounded-xl bg-gradient-to-r from-rose-200/60 via-purple-200/60 to-violet-200/60 p-px transition-all hover:from-rose-200 hover:via-purple-200 hover:to-violet-200 dark:from-rose-400/20 dark:via-purple-400/20 dark:to-violet-400/20 dark:hover:from-rose-400/30 dark:hover:via-purple-400/30 dark:hover:to-violet-400/30"
                >
                    <div className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 dark:bg-[#0a0a0f]">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                            <Play className="size-5 text-black/60 dark:text-white/60" />
                        </div>
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-black dark:text-white">
                                    Random Call
                                </span>
                                <span className="flex items-center gap-1 rounded-full bg-[#EDE9FE] px-1.5 py-0.5 text-[10px] font-medium text-[#7C3AED] dark:bg-purple-500/20 dark:text-purple-300">
                                    <Sparkles className="size-2.5" />
                                    AI
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                                Practice with a random company from your ICPs
                            </p>
                        </div>
                        <ChevronRight className="size-4 text-black/30 transition-transform group-hover:translate-x-0.5 dark:text-white/30" />
                    </div>
                </button>

                {/* Manual Setup */}
                <button
                    onClick={handleManualSetup}
                    className="group flex items-center gap-4 rounded-xl border border-black/10 bg-white px-4 py-3 text-left transition-all hover:border-black/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
                >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                        <Settings2 className="size-5 text-black/60 dark:text-white/60" />
                    </div>
                    <div className="flex-1">
                        <span className="text-sm font-medium text-black dark:text-white">
                            Manual Setup
                        </span>
                        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                            Configure custom scenario and difficulty
                        </p>
                    </div>
                    <ChevronRight className="size-4 text-black/30 transition-transform group-hover:translate-x-0.5 dark:text-white/30" />
                </button>
            </div>

            {/* Recent Calls */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-black dark:text-white">
                        Recent Calls
                    </h2>
                    <Link
                        href="/dashboard/trainer/history"
                        className="text-xs font-medium text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                    >
                        View All
                    </Link>
                </div>

                <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                    Company
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                    Contact
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                    Duration
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                    Score
                                </th>
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                    When
                                </th>
                                <th className="px-4 py-2.5 text-right text-xs font-medium text-black/40 dark:text-white/40">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {mockRecentCalls.map((call) => (
                                <tr
                                    key={call.id}
                                    className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                >
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-7 items-center justify-center rounded-md bg-black/5 dark:bg-white/5">
                                                <Building2 className="size-3.5 text-black/40 dark:text-white/40" />
                                            </div>
                                            <span className="text-sm text-black dark:text-white">
                                                {call.companyName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-5 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                                <User className="size-2.5 text-black/40 dark:text-white/40" />
                                            </div>
                                            <div>
                                                <div className="text-sm text-black/70 dark:text-white/70">
                                                    {call.contactName}
                                                </div>
                                                <div className="text-[11px] text-black/40 dark:text-white/40">
                                                    {call.contactTitle}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50">
                                            <Clock className="size-3" />
                                            {formatDuration(call.duration)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {call.status === 'completed' ? (
                                            <span
                                                className={cn(
                                                    'text-sm font-medium tabular-nums',
                                                    getScoreColor(call.score)
                                                )}
                                            >
                                                {call.score}%
                                            </span>
                                        ) : (
                                            <span className="text-xs text-black/40 dark:text-white/40">
                                                Abandoned
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-xs text-black/40 dark:text-white/40">
                                            {formatTimeAgo(call.createdAt)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <Link
                                            href={`/dashboard/trainer/history/${call.id}`}
                                            className="text-xs font-medium text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
