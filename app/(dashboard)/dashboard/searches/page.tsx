'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Plus,
    Search,
    MoreHorizontal,
    Play,
    Pause,
    Trash2,
    Calendar,
    MapPin,
    Building2,
    Briefcase,
    Clock,
    RefreshCw,
    TrendingUp,
} from 'lucide-react'
import { CreateSearchModal } from '@/components/dashboard/create-search-modal'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const searches = [
    {
        id: '1',
        name: 'Senior Engineers in Bay Area',
        jobTitle: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        companies: 12,
        jobs: 45,
        newJobs: 8,
        lastRun: '2h ago',
        nextRun: 'Tomorrow 9AM',
        status: 'active',
        schedule: 'Daily',
        filters: {
            experienceLevel: 'Mid-Senior',
            jobType: 'Full-time',
            remote: 'Any',
        },
    },
    {
        id: '2',
        name: 'Product Managers - Remote',
        jobTitle: 'Product Manager',
        location: 'Remote',
        companies: 15,
        jobs: 38,
        newJobs: 5,
        lastRun: '4h ago',
        nextRun: 'Tomorrow 9AM',
        status: 'active',
        schedule: 'Daily',
        filters: {
            experienceLevel: 'Any',
            jobType: 'Full-time',
            remote: 'Remote',
        },
    },
    {
        id: '3',
        name: 'Sales Roles - NYC',
        jobTitle: 'Sales Director',
        location: 'New York, NY',
        companies: 8,
        jobs: 19,
        newJobs: 0,
        lastRun: '1d ago',
        nextRun: 'Paused',
        status: 'paused',
        schedule: 'Weekly',
        filters: {
            experienceLevel: 'Director',
            jobType: 'Full-time',
            remote: 'On-site',
        },
    },
    {
        id: '4',
        name: 'Data Scientists - Tech Hubs',
        jobTitle: 'Data Scientist',
        location: 'Seattle, WA',
        companies: 8,
        jobs: 23,
        newJobs: 3,
        lastRun: '6h ago',
        nextRun: 'In 18 hours',
        status: 'active',
        schedule: 'Daily',
        filters: {
            experienceLevel: 'Mid-Senior',
            jobType: 'Full-time',
            remote: 'Any',
        },
    },
]

const stats = [
    { label: 'Total Searches', value: searches.length, icon: Search, color: 'from-blue-500 to-cyan-500' },
    { label: 'Active', value: searches.filter(s => s.status === 'active').length, icon: Play, color: 'from-green-500 to-emerald-500' },
    { label: 'Companies Found', value: searches.reduce((acc, s) => acc + s.companies, 0), icon: Building2, color: 'from-purple-500 to-pink-500' },
    { label: 'Jobs Found', value: searches.reduce((acc, s) => acc + s.jobs, 0), icon: Briefcase, color: 'from-orange-500 to-amber-500' },
]

export default function SearchesPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Searches</h1>
                    <p className="text-sm text-white/40">
                        Manage your job search configurations
                    </p>
                </div>
                <Button
                    size="sm"
                    className="h-8 bg-white text-sm text-black hover:bg-white/90"
                    onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-1.5 size-3.5" />
                    New Search
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                                <div className="text-sm text-white/40">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Searches List */}
            <div className="space-y-2">
                {searches.map((search) => (
                    <div
                        key={search.id}
                        className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.04]">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/5 blur-3xl" />

                        <div className="relative p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                                        <Search className="size-4 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-sm font-medium text-white">{search.name}</h3>
                                            <div className="relative flex size-1.5">
                                                {search.status === 'active' && (
                                                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                                                )}
                                                <span
                                                    className={`relative inline-flex size-1.5 rounded-full ${
                                                        search.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                                                    }`}
                                                />
                                            </div>
                                            <span
                                                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                                    search.status === 'active'
                                                        ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                                                }`}>
                                                {search.status}
                                            </span>
                                            {search.newJobs > 0 && (
                                                <span className="flex items-center gap-0.5 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                    <TrendingUp className="size-2.5" />
                                                    +{search.newJobs} new
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/30">
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="size-3" />
                                                {search.jobTitle}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3" />
                                                {search.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="size-3" />
                                                {search.schedule}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-white/40 hover:bg-white/10 hover:text-white">
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </div>

                            {/* Results summary */}
                            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                                    <div className="text-lg font-semibold text-white">{search.companies}</div>
                                    <div className="text-[10px] text-white/30">Companies</div>
                                </div>
                                <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                                    <div className="text-lg font-semibold text-white">{search.jobs}</div>
                                    <div className="text-[10px] text-white/30">Jobs Found</div>
                                </div>
                                <div className="rounded-lg bg-white/5 px-3 py-2">
                                    <div className="text-[10px] text-white/30">Experience</div>
                                    <div className="text-xs font-medium text-white">{search.filters.experienceLevel}</div>
                                </div>
                                <div className="rounded-lg bg-white/5 px-3 py-2">
                                    <div className="text-[10px] text-white/30">Work Type</div>
                                    <div className="text-xs font-medium text-white">{search.filters.remote}</div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="relative flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-4 py-2">
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-white/40">
                                    <Clock className="size-3" />
                                    Last: <span className="text-white/60">{search.lastRun}</span>
                                </span>
                                <span className="text-white/40">
                                    Next: <span className="text-white/60">{search.nextRun}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                    <RefreshCw className="mr-1 size-3" />
                                    Run
                                </Button>
                                {search.status === 'active' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                        <Pause className="mr-1 size-3" />
                                        Pause
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                        <Play className="mr-1 size-3" />
                                        Resume
                                    </Button>
                                )}
                                <Link href="/dashboard/companies">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                        <Building2 className="mr-1 size-3" />
                                        Companies
                                    </Button>
                                </Link>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-400/50 hover:bg-red-500/10 hover:text-red-400">
                                    <Trash2 className="size-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty state */}
            {searches.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                        <Search className="size-5 text-white/30" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-white">No searches yet</h3>
                    <p className="mt-1 max-w-sm text-xs text-white/40">
                        Create your first search to start finding companies and their open positions.
                    </p>
                    <Button
                        className="mt-4 h-8 bg-white text-sm text-black hover:bg-white/90"
                        onClick={() => setIsCreateModalOpen(true)}>
                        <Plus className="mr-1.5 size-3.5" />
                        Create Search
                    </Button>
                </div>
            )}

            <CreateSearchModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    )
}
