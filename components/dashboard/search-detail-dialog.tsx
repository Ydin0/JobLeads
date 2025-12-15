'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Search,
    MapPin,
    Briefcase,
    Building2,
    Users,
    ExternalLink,
    Clock,
    Calendar,
    Loader2,
    Play,
    Linkedin,
    Mail,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Search as SearchType, Company, Job, Lead } from '@/lib/db/schema'
import { useRunningSearches } from '@/hooks/use-running-searches'

interface SearchWithRelations extends SearchType {
    companies: Company[]
    jobs: Job[]
    leads: Lead[]
}

interface SearchFilters {
    jobTitles?: string[]
    locations?: string[]
    companyNames?: string[]
    rows?: number
    publishedAt?: string
}

interface SearchDetailDialogProps {
    searchId: string | null
    onClose: () => void
    onRunSearch?: (id: string) => void
}

export function SearchDetailDialog({ searchId, onClose, onRunSearch }: SearchDetailDialogProps) {
    const [search, setSearch] = useState<SearchWithRelations | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'companies'>('overview')
    const { isRunning } = useRunningSearches()

    useEffect(() => {
        if (searchId) {
            setIsLoading(true)
            setActiveTab('overview')
            fetch(`/api/searches/${searchId}`)
                .then(res => res.json())
                .then(data => {
                    setSearch(data)
                    setIsLoading(false)
                })
                .catch(err => {
                    console.error('Error fetching search:', err)
                    setIsLoading(false)
                })
        }
    }, [searchId])

    if (!searchId) return null

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Never'
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    const formatRelativeDate = (date: Date | string | null) => {
        if (!date) return 'Never'
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const hours = Math.floor(diff / (1000 * 60 * 60))
        if (hours < 1) return 'Just now'
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}d ago`
        return d.toLocaleDateString()
    }

    const filters = search?.filters as SearchFilters | null
    const searchIsRunning = searchId ? isRunning(searchId) : false

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-cyan-500/10 blur-3xl" />

                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-white/40" />
                    </div>
                ) : search ? (
                    <>
                        {/* Header */}
                        <div className="relative flex shrink-0 items-start justify-between border-b border-white/5 p-4">
                            <div className="flex items-start gap-4">
                                <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                                    <Search className="size-5 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-white">{search.name}</h2>
                                        {searchIsRunning ? (
                                            <span className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                                <Loader2 className="size-3 animate-spin" />
                                                running
                                            </span>
                                        ) : (
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
                                                    search.status === 'active'
                                                        ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                                                        : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                                                )}>
                                                {search.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/40">
                                        {filters?.jobTitles?.[0] && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="size-3" />
                                                {filters.jobTitles[0]}
                                            </span>
                                        )}
                                        {filters?.locations?.[0] && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3" />
                                                {filters.locations[0]}
                                            </span>
                                        )}
                                        {filters?.companyNames && filters.companyNames.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Building2 className="size-3" />
                                                {filters.companyNames.length} target companies
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        {onRunSearch && !searchIsRunning && (
                                            <Button
                                                size="sm"
                                                onClick={() => onRunSearch(search.id)}
                                                className="h-7 bg-gradient-to-r from-blue-500 to-cyan-500 px-3 text-xs text-white hover:from-blue-600 hover:to-cyan-600">
                                                <Play className="mr-1.5 size-3" />
                                                Run Search
                                            </Button>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-white/30">
                                            <Clock className="size-3" />
                                            Last run: {formatRelativeDate(search.lastRunAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="relative grid shrink-0 grid-cols-4 gap-3 border-b border-white/5 p-4">
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{search.jobs?.length || 0}</div>
                                <div className="text-xs text-white/40">Jobs Found</div>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{search.companies?.length || 0}</div>
                                <div className="text-xs text-white/40">Companies</div>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{search.leads?.length || 0}</div>
                                <div className="text-xs text-white/40">Contacts</div>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{filters?.rows || 100}</div>
                                <div className="text-xs text-white/40">Max Results</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="relative flex shrink-0 gap-1 border-b border-white/5 px-4">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === 'overview'
                                        ? 'border-white text-white'
                                        : 'border-transparent text-white/40 hover:text-white/60'
                                )}>
                                <Search className="size-4" />
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('jobs')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === 'jobs'
                                        ? 'border-white text-white'
                                        : 'border-transparent text-white/40 hover:text-white/60'
                                )}>
                                <Briefcase className="size-4" />
                                Jobs ({search.jobs?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('companies')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === 'companies'
                                        ? 'border-white text-white'
                                        : 'border-transparent text-white/40 hover:text-white/60'
                                )}>
                                <Building2 className="size-4" />
                                Companies ({search.companies?.length || 0})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-4">
                            {activeTab === 'overview' && (
                                <div className="space-y-4">
                                    {/* Search Configuration */}
                                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                                        <h3 className="mb-3 text-sm font-medium text-white">Search Configuration</h3>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Job Title</div>
                                                <div className="text-sm text-white">{filters?.jobTitles?.[0] || 'Any'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Location</div>
                                                <div className="text-sm text-white">{filters?.locations?.[0] || 'Any'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Target Companies</div>
                                                <div className="text-sm text-white">
                                                    {filters?.companyNames?.length
                                                        ? filters.companyNames.join(', ')
                                                        : 'Any'}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Max Results</div>
                                                <div className="text-sm text-white">{filters?.rows || 100} jobs</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Created</div>
                                                <div className="text-sm text-white">{formatDate(search.createdAt)}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Last Run</div>
                                                <div className="text-sm text-white">{formatDate(search.lastRunAt)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Jobs Preview */}
                                    {search.jobs && search.jobs.length > 0 && (
                                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-white">Recent Jobs</h3>
                                                <button
                                                    onClick={() => setActiveTab('jobs')}
                                                    className="text-xs text-white/40 hover:text-white">
                                                    View all ({search.jobs.length})
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {search.jobs.slice(0, 3).map((job) => (
                                                    <div
                                                        key={job.id}
                                                        className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-white truncate">{job.title}</div>
                                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-white/40">
                                                                {job.location && (
                                                                    <span className="flex items-center gap-1">
                                                                        <MapPin className="size-3" />
                                                                        {job.location}
                                                                    </span>
                                                                )}
                                                                {job.salary && (
                                                                    <span className="text-green-400">{job.salary}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {job.jobUrl && (
                                                            <a
                                                                href={job.jobUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-2 rounded p-1.5 text-white/30 hover:bg-white/10 hover:text-white">
                                                                <ExternalLink className="size-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recent Companies Preview */}
                                    {search.companies && search.companies.length > 0 && (
                                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <h3 className="text-sm font-medium text-white">Companies Found</h3>
                                                <button
                                                    onClick={() => setActiveTab('companies')}
                                                    className="text-xs text-white/40 hover:text-white">
                                                    View all ({search.companies.length})
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {search.companies.slice(0, 3).map((company) => (
                                                    <div
                                                        key={company.id}
                                                        className="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                                                        {company.logoUrl ? (
                                                            <img
                                                                src={company.logoUrl}
                                                                alt={company.name}
                                                                className="size-8 rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-xs font-medium text-white">
                                                                {company.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-sm font-medium text-white truncate">{company.name}</div>
                                                            <div className="text-xs text-white/40">{company.industry || 'Unknown industry'}</div>
                                                        </div>
                                                        {company.isEnriched && (
                                                            <span className="flex items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-xs text-green-400">
                                                                <Sparkles className="size-3" />
                                                                Enriched
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Empty state */}
                                    {(!search.jobs || search.jobs.length === 0) && (!search.companies || search.companies.length === 0) && (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-white/5">
                                                <Search className="size-5 text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-white/40">No results yet</p>
                                            <p className="text-xs text-white/30">Run this search to find jobs and companies</p>
                                            {onRunSearch && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onRunSearch(search.id)}
                                                    className="mt-3 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-xs text-white hover:from-blue-600 hover:to-cyan-600">
                                                    <Play className="mr-1.5 size-3" />
                                                    Run Search
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'jobs' && (
                                <div className="space-y-2">
                                    {search.jobs && search.jobs.length > 0 ? (
                                        search.jobs.map((job) => (
                                            <div
                                                key={job.id}
                                                className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-medium text-white">{job.title}</h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">
                                                            {job.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="size-3" />
                                                                    {job.location}
                                                                </span>
                                                            )}
                                                            {job.contractType && (
                                                                <span className="rounded bg-white/10 px-1.5 py-0.5">{job.contractType}</span>
                                                            )}
                                                            {job.experienceLevel && (
                                                                <span className="rounded bg-white/10 px-1.5 py-0.5">{job.experienceLevel}</span>
                                                            )}
                                                            {job.salary && (
                                                                <span className="text-green-400">{job.salary}</span>
                                                            )}
                                                        </div>
                                                        {job.postedTime && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-white/30">
                                                                <Clock className="size-3" />
                                                                {job.postedTime}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {job.jobUrl && (
                                                        <a
                                                            href={job.jobUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                            <ExternalLink className="size-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-white/5">
                                                <Briefcase className="size-5 text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-white/40">No jobs found</p>
                                            <p className="text-xs text-white/30">Run this search to find jobs</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'companies' && (
                                <div className="space-y-2">
                                    {search.companies && search.companies.length > 0 ? (
                                        search.companies.map((company) => (
                                            <div
                                                key={company.id}
                                                className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                                <div className="flex items-center gap-3">
                                                    {company.logoUrl ? (
                                                        <img
                                                            src={company.logoUrl}
                                                            alt={company.name}
                                                            className="size-10 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-sm font-bold text-white ring-1 ring-inset ring-white/10">
                                                            {company.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium text-white">{company.name}</h4>
                                                            {company.industry && (
                                                                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/40">
                                                                    {company.industry}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-3 text-xs text-white/40">
                                                            {company.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="size-3" />
                                                                    {company.location}
                                                                </span>
                                                            )}
                                                            {company.size && (
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="size-3" />
                                                                    {company.size}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {company.isEnriched ? (
                                                            <span className="flex items-center gap-1 rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-400">
                                                                <Sparkles className="size-3" />
                                                                Enriched
                                                            </span>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                className="h-6 bg-gradient-to-r from-purple-500 to-blue-500 px-2 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                                                <Sparkles className="mr-1 size-3" />
                                                                Enrich
                                                            </Button>
                                                        )}
                                                        {company.linkedinUrl && (
                                                            <a
                                                                href={company.linkedinUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded p-1.5 text-blue-400/60 transition-colors hover:bg-blue-500/10 hover:text-blue-400">
                                                                <Linkedin className="size-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-white/5">
                                                <Building2 className="size-5 text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-white/40">No companies found</p>
                                            <p className="text-xs text-white/30">Run this search to find companies</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-white/40">Search not found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
