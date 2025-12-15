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
    MapPin,
    Building2,
    Briefcase,
    Clock,
    RefreshCw,
    Loader2,
} from 'lucide-react'
import { CreateSearchModal } from '@/components/dashboard/create-search-modal'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useSearches } from '@/hooks/use-searches'

export default function SearchesPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [runningSearchId, setRunningSearchId] = useState<string | null>(null)
    const { searches, isLoading, fetchSearches, runSearch, updateSearch, deleteSearch } = useSearches()

    const handleRunSearch = async (id: string) => {
        try {
            setRunningSearchId(id)
            await runSearch(id)
        } catch (error) {
            console.error('Error running search:', error)
        } finally {
            setRunningSearchId(null)
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        try {
            await updateSearch(id, {
                status: currentStatus === 'active' ? 'paused' : 'active',
            })
        } catch (error) {
            console.error('Error updating search:', error)
        }
    }

    const handleDeleteSearch = async (id: string) => {
        if (!confirm('Are you sure you want to delete this search?')) return
        try {
            await deleteSearch(id)
        } catch (error) {
            console.error('Error deleting search:', error)
        }
    }

    const stats = [
        { label: 'Total Searches', value: searches.length, icon: Search, color: 'from-blue-500 to-cyan-500' },
        { label: 'Active', value: searches.filter(s => s.status === 'active').length, icon: Play, color: 'from-green-500 to-emerald-500' },
        { label: 'Companies Found', value: searches.reduce((acc, s) => acc + (s.resultsCount || 0), 0), icon: Building2, color: 'from-purple-500 to-pink-500' },
        { label: 'Paused', value: searches.filter(s => s.status === 'paused').length, icon: Pause, color: 'from-orange-500 to-amber-500' },
    ]

    const formatDate = (date: Date | string | null) => {
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

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-white/40" />
                </div>
            )}

            {/* Searches List */}
            {!isLoading && searches.length > 0 && (
                <div className="space-y-2">
                    {searches.map((search) => {
                        const filters = search.filters as {
                            jobTitles?: string[]
                            locations?: string[]
                            companyNames?: string[]
                        } | null

                        return (
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
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/30">
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
                                                            {filters.companyNames.length} companies
                                                        </span>
                                                    )}
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
                                            <div className="text-lg font-semibold text-white">{search.resultsCount || 0}</div>
                                            <div className="text-[10px] text-white/30">Companies</div>
                                        </div>
                                        <div className="rounded-lg bg-white/5 px-3 py-2 text-center">
                                            <div className="text-lg font-semibold text-white">—</div>
                                            <div className="text-[10px] text-white/30">Jobs Found</div>
                                        </div>
                                        <div className="rounded-lg bg-white/5 px-3 py-2">
                                            <div className="text-[10px] text-white/30">Last Run</div>
                                            <div className="text-xs font-medium text-white">{formatDate(search.lastRunAt)}</div>
                                        </div>
                                        <div className="rounded-lg bg-white/5 px-3 py-2">
                                            <div className="text-[10px] text-white/30">Created</div>
                                            <div className="text-xs font-medium text-white">{formatDate(search.createdAt)}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="relative flex items-center justify-between border-t border-white/5 bg-white/[0.01] px-4 py-2">
                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="flex items-center gap-1 text-white/40">
                                            <Clock className="size-3" />
                                            Last: <span className="text-white/60">{formatDate(search.lastRunAt)}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRunSearch(search.id)}
                                            disabled={runningSearchId === search.id}
                                            className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-50">
                                            {runningSearchId === search.id ? (
                                                <Loader2 className="mr-1 size-3 animate-spin" />
                                            ) : (
                                                <RefreshCw className="mr-1 size-3" />
                                            )}
                                            {runningSearchId === search.id ? 'Running...' : 'Run'}
                                        </Button>
                                        {search.status === 'active' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(search.id, search.status)}
                                                className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                                                <Pause className="mr-1 size-3" />
                                                Pause
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(search.id, search.status)}
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
                                            onClick={() => handleDeleteSearch(search.id)}
                                            className="h-7 w-7 p-0 text-red-400/50 hover:bg-red-500/10 hover:text-red-400">
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && searches.length === 0 && (
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
                onSearchCreated={() => fetchSearches()}
            />
        </div>
    )
}
