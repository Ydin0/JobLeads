'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    Plus,
    Target,
    Building2,
    Sparkles,
    MoreVertical,
    Edit2,
    Trash2,
    ChevronRight,
    Briefcase,
    Search,
    Loader2,
    TrendingUp,
    Clock,
    Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

// Types for API response
interface SearchFilters {
    jobTitles?: string[]
    departments?: string[]
    techStack?: string[]
    minJobs?: number
    scrapers?: Array<{
        jobTitle: string
        location: string
        experienceLevel: string
    }>
}

interface ICPData {
    id: string
    name: string
    description: string | null
    filters: SearchFilters | null
    status: string
    resultsCount: number | null
    jobsCount: number | null
    lastRunAt: string | null
    createdAt: string
}

export default function ICPsPage() {
    const [icps, setIcps] = useState<ICPData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [openMenu, setOpenMenu] = useState<string | null>(null)

    // Fetch ICPs from API
    const fetchICPs = useCallback(async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/searches')
            if (response.ok) {
                const data = await response.json()
                setIcps(data)
            }
        } catch (error) {
            console.error('Error fetching ICPs:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchICPs()
    }, [fetchICPs])

    const totalMatches = icps.reduce((acc, icp) => acc + (icp.resultsCount || 0), 0)
    const totalJobs = icps.reduce((acc, icp) => acc + (icp.jobsCount || 0), 0)

    const formatTimeAgo = (dateString: string | null) => {
        if (!dateString) return 'Never'
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        return `${diffDays}d ago`
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-black dark:text-white">ICPs</h1>
                    <p className="mt-1 text-sm text-black/50 dark:text-white/50">
                        Track hiring signals that indicate buying intent
                    </p>
                </div>
                <Link href="/dashboard/icps/new">
                    <Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                        <Plus className="mr-2 size-4" />
                        New ICP
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 border-b border-black/5 pb-6 dark:border-white/5">
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{icps.length}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Active ICPs</div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{totalMatches.toLocaleString()}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Companies found</div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{totalJobs.toLocaleString()}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Jobs scraped</div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-black/30 dark:text-white/30" />
                </div>
            )}

            {/* ICP Grid */}
            {!isLoading && icps.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {icps.map((icp) => {
                        const scraperCount = icp.filters?.scrapers?.length || 0

                        return (
                            <Link
                                key={icp.id}
                                href={`/dashboard/icps/${icp.id}`}
                                className="group relative rounded-xl border border-black/10 bg-white p-5 transition-all hover:border-black/20 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
                            >
                                {/* Menu Button */}
                                <div className="absolute right-3 top-3">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setOpenMenu(openMenu === icp.id ? null : icp.id)
                                        }}
                                        className="flex size-7 items-center justify-center rounded-md text-black/30 opacity-0 transition-all hover:bg-black/5 hover:text-black group-hover:opacity-100 dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-white"
                                    >
                                        <MoreVertical className="size-4" />
                                    </button>
                                    {openMenu === icp.id && (
                                        <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0a0a0f]">
                                            <button
                                                onClick={(e) => e.preventDefault()}
                                                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-black/60 transition-colors hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                                            >
                                                <Edit2 className="size-3" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => e.preventDefault()}
                                                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-xs text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 className="size-3" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Icon & Name */}
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                                        <Target className="size-5 text-black/60 dark:text-white/60" />
                                    </div>
                                    <div className="min-w-0 flex-1 pr-6">
                                        <h3 className="truncate text-sm font-semibold text-black dark:text-white">
                                            {icp.name}
                                        </h3>
                                        <p className="mt-0.5 truncate text-xs text-black/50 dark:text-white/50">
                                            {icp.description || 'No description'}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="mt-5 grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-lg font-semibold text-black dark:text-white">
                                            {icp.resultsCount || 0}
                                        </div>
                                        <div className="text-[11px] text-black/40 dark:text-white/40">Companies</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold text-black dark:text-white">
                                            {icp.jobsCount || 0}
                                        </div>
                                        <div className="text-[11px] text-black/40 dark:text-white/40">Jobs</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-semibold text-black dark:text-white">
                                            {scraperCount}
                                        </div>
                                        <div className="text-[11px] text-black/40 dark:text-white/40">Scrapers</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 text-xs text-black/40 dark:text-white/40">
                                        <Clock className="size-3" />
                                        {formatTimeAgo(icp.lastRunAt)}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-medium text-black/60 group-hover:text-black dark:text-white/60 dark:group-hover:text-white">
                                        View
                                        <ChevronRight className="size-3" />
                                    </div>
                                </div>
                            </Link>
                        )
                    })}

                    {/* Add New Card */}
                    <Link
                        href="/dashboard/icps/new"
                        className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.01] p-5 transition-all hover:border-black/20 hover:bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.01] dark:hover:border-white/20 dark:hover:bg-white/[0.02]"
                    >
                        <div className="flex size-10 items-center justify-center rounded-full border border-black/10 dark:border-white/10">
                            <Plus className="size-5 text-black/40 dark:text-white/40" />
                        </div>
                        <span className="mt-3 text-sm font-medium text-black/60 dark:text-white/60">
                            Create new ICP
                        </span>
                    </Link>
                </div>
            ) : !isLoading && (
                /* Empty State */
                <div className="flex flex-col items-center justify-center rounded-xl border border-black/10 bg-white py-20 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <div className="flex size-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <Target className="size-8 text-black/40 dark:text-white/40" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-black dark:text-white">
                        Create your first ICP
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm text-black/50 dark:text-white/50">
                        Define your Ideal Customer Profile and we&apos;ll track hiring signals to find companies that match.
                    </p>
                    <Link href="/dashboard/icps/new">
                        <Button className="mt-6 h-10 rounded-full bg-black px-6 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            <Plus className="mr-2 size-4" />
                            Create ICP
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
