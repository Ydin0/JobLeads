'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
    ArrowLeft,
    Building2,
    User,
    Clock,
    Play,
    Search,
    ChevronLeft,
    ChevronRight,
    Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MultiSelectFilter } from '@/components/ui/filter-combobox'

// Mock call history data
const mockCalls = [
    {
        id: '1',
        agentName: 'You',
        agentId: 'current',
        companyName: 'Acme Corporation',
        contactName: 'Sarah Johnson',
        contactTitle: 'VP of Sales Operations',
        duration: 312,
        score: 85,
        status: 'completed' as const,
        mode: 'random' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
        id: '2',
        agentName: 'You',
        agentId: 'current',
        companyName: 'TechStart Inc',
        contactName: 'John Smith',
        contactTitle: 'Head of Product',
        duration: 245,
        score: 72,
        status: 'completed' as const,
        mode: 'manual' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: '3',
        agentName: 'Mike Chen',
        agentId: 'mike',
        companyName: 'DataFlow Systems',
        contactName: 'Emily Davis',
        contactTitle: 'CTO',
        duration: 0,
        score: 0,
        status: 'abandoned' as const,
        mode: 'random' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
        id: '4',
        agentName: 'Sarah Lee',
        agentId: 'sarah',
        companyName: 'CloudScale',
        contactName: 'Alex Rivera',
        contactTitle: 'Director of Sales',
        duration: 428,
        score: 91,
        status: 'completed' as const,
        mode: 'manual' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: '5',
        agentName: 'You',
        agentId: 'current',
        companyName: 'InnovateTech',
        contactName: 'Chris Taylor',
        contactTitle: 'Engineering Manager',
        duration: 189,
        score: 68,
        status: 'completed' as const,
        mode: 'random' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
        id: '6',
        agentName: 'Mike Chen',
        agentId: 'mike',
        companyName: 'GlobalTech',
        contactName: 'Jennifer Lee',
        contactTitle: 'VP of Engineering',
        duration: 356,
        score: 79,
        status: 'completed' as const,
        mode: 'random' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
    {
        id: '7',
        agentName: 'You',
        agentId: 'current',
        companyName: 'NextGen Solutions',
        contactName: 'Rachel Park',
        contactTitle: 'VP of Operations',
        duration: 356,
        score: 88,
        status: 'completed' as const,
        mode: 'manual' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96),
    },
    {
        id: '8',
        agentName: 'Sarah Lee',
        agentId: 'sarah',
        companyName: 'Quantum Labs',
        contactName: 'David Miller',
        contactTitle: 'Head of Engineering',
        duration: 267,
        score: 76,
        status: 'completed' as const,
        mode: 'random' as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120),
    },
]

const teamMembers = ['You', 'Mike Chen', 'Sarah Lee']
const scoreRanges = ['Excellent (80+)', 'Good (60-79)', 'Average (40-59)', 'Needs Work (<40)']

function formatDuration(seconds: number): string {
    if (seconds === 0) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60))
            return `${minutes}m ago`
        }
        return `${hours}h ago`
    }
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HistoryPage() {
    const [viewMode, setViewMode] = useState<'my' | 'team'>('my')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedScores, setSelectedScores] = useState<string[]>([])
    const [selectedAgents, setSelectedAgents] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const itemsPerPage = 10

    // Filter calls based on view mode and filters
    const filteredCalls = mockCalls.filter((call) => {
        // View mode filter
        if (viewMode === 'my' && call.agentId !== 'current') return false

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            if (
                !call.companyName.toLowerCase().includes(query) &&
                !call.contactName.toLowerCase().includes(query)
            ) {
                return false
            }
        }

        // Score filter
        if (selectedScores.length > 0) {
            if (call.status === 'abandoned') return false
            const matchesScore = selectedScores.some((range) => {
                if (range === 'Excellent (80+)') return call.score >= 80
                if (range === 'Good (60-79)') return call.score >= 60 && call.score < 80
                if (range === 'Average (40-59)') return call.score >= 40 && call.score < 60
                if (range === 'Needs Work (<40)') return call.score < 40
                return false
            })
            if (!matchesScore) return false
        }

        // Agent filter (only in team view)
        if (viewMode === 'team' && selectedAgents.length > 0) {
            if (!selectedAgents.includes(call.agentName)) return false
        }

        return true
    })

    const totalPages = Math.ceil(filteredCalls.length / itemsPerPage)
    const paginatedCalls = filteredCalls.slice((page - 1) * itemsPerPage, page * itemsPerPage)

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
                            Call History
                        </h1>
                        <p className="text-sm text-black/50 dark:text-white/50">
                            Review past practice calls and recordings
                        </p>
                    </div>
                </div>

                {/* View Mode Toggle with smooth animation */}
                <div className="relative flex items-center rounded-full border border-black/10 p-0.5 dark:border-white/10">
                    {/* Animated background pill */}
                    <div
                        className={cn(
                            'absolute h-[calc(100%-4px)] rounded-full bg-black transition-all duration-200 ease-out dark:bg-white',
                            viewMode === 'my' ? 'left-0.5 w-[calc(50%-2px)]' : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
                        )}
                    />
                    <button
                        onClick={() => setViewMode('my')}
                        className={cn(
                            'relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            viewMode === 'my'
                                ? 'text-white dark:text-black'
                                : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                        )}
                    >
                        <User className="size-3.5" />
                        My Calls
                    </button>
                    <button
                        onClick={() => setViewMode('team')}
                        className={cn(
                            'relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                            viewMode === 'team'
                                ? 'text-white dark:text-black'
                                : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
                        )}
                    >
                        <Users className="size-3.5" />
                        Team
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 dark:text-white/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search calls..."
                        className="h-9 w-full rounded-lg border border-black/10 bg-white pl-9 pr-4 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                    />
                </div>

                {/* Score Filter - using shadcn MultiSelectFilter */}
                <MultiSelectFilter
                    options={scoreRanges}
                    selectedValues={selectedScores}
                    onChange={setSelectedScores}
                    placeholder="Score"
                    searchPlaceholder="Search scores..."
                    className="w-[140px]"
                />

                {/* Agent Filter (only in team view) - using shadcn MultiSelectFilter */}
                {viewMode === 'team' && (
                    <MultiSelectFilter
                        options={teamMembers}
                        selectedValues={selectedAgents}
                        onChange={setSelectedAgents}
                        placeholder="Agent"
                        searchPlaceholder="Search agents..."
                        className="w-[140px]"
                    />
                )}

                <span className="text-xs text-black/40 dark:text-white/40">
                    {filteredCalls.length} calls
                </span>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                            {viewMode === 'team' && (
                                <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                    Agent
                                </th>
                            )}
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                Company
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                Contact
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                Mode
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                Duration
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                Score
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                                Date
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium text-black/40 dark:text-white/40">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        {paginatedCalls.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={viewMode === 'team' ? 8 : 7}
                                    className="px-4 py-12 text-center text-sm text-black/50 dark:text-white/50"
                                >
                                    No calls found matching your filters
                                </td>
                            </tr>
                        ) : (
                            paginatedCalls.map((call) => (
                                <tr
                                    key={call.id}
                                    className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                >
                                    {viewMode === 'team' && (
                                        <td className="px-4 py-2.5">
                                            <span className="text-sm text-black/70 dark:text-white/70">
                                                {call.agentName}
                                            </span>
                                        </td>
                                    )}
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
                                        <div>
                                            <div className="text-sm text-black/70 dark:text-white/70">
                                                {call.contactName}
                                            </div>
                                            <div className="text-[11px] text-black/40 dark:text-white/40">
                                                {call.contactTitle}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium capitalize text-black/60 dark:bg-white/5 dark:text-white/60">
                                            {call.mode}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-1 text-xs text-black/50 dark:text-white/50">
                                            <Clock className="size-3" />
                                            {formatDuration(call.duration)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        {call.status === 'completed' ? (
                                            <span className="text-sm font-medium tabular-nums text-black/70 dark:text-white/70">
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
                                            {formatDate(call.createdAt)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/dashboard/trainer/history/${call.id}`}
                                                className="text-xs font-medium text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white"
                                            >
                                                View
                                            </Link>
                                            {call.status === 'completed' && (
                                                <button className="flex size-7 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                                                    <Play className="size-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-xs text-black/40 dark:text-white/40">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                        >
                            <ChevronLeft className="mr-1 size-3.5" />
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                        >
                            Next
                            <ChevronRight className="ml-1 size-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
