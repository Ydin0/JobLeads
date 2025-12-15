'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Users,
    Building2,
    Search,
    Briefcase,
    ArrowUpRight,
    Plus,
    ExternalLink,
    Sparkles,
    CheckCircle2,
    Clock,
    ChevronRight,
    Mail,
    Linkedin,
    MapPin,
    Calendar,
    TrendingUp,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useSearches } from '@/hooks/use-searches'
import { useCompanies } from '@/hooks/use-companies'
import { useLeads } from '@/hooks/use-leads'

interface CompanyMetadata {
    linkedinId?: string
    jobCount?: number
    jobs?: {
        id: string
        title: string
        url: string
        location: string
        publishedAt: string
    }[]
}

interface SearchFilters {
    jobTitles?: string[]
    locations?: string[]
    companyNames?: string[]
}

export default function DashboardPage() {
    const { searches, isLoading: searchesLoading } = useSearches()
    const { companies, isLoading: companiesLoading } = useCompanies()
    const { leads, isLoading: leadsLoading } = useLeads()

    const isLoading = searchesLoading || companiesLoading || leadsLoading

    // Calculate total jobs from companies metadata
    const totalJobs = companies.reduce((acc, c) => {
        const metadata = c.metadata as CompanyMetadata | null
        return acc + (metadata?.jobCount || 0)
    }, 0)

    const stats = [
        {
            name: 'Companies Found',
            value: companies.length,
            change: `${companies.filter(c => c.isEnriched).length} enriched`,
            changeType: companies.filter(c => c.isEnriched).length > 0 ? 'positive' : 'neutral',
            icon: Building2,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            name: 'Open Positions',
            value: totalJobs,
            change: `From ${companies.length} companies`,
            changeType: totalJobs > 0 ? 'positive' : 'neutral',
            icon: Briefcase,
            color: 'from-purple-500 to-pink-500',
        },
        {
            name: 'Contacts Found',
            value: leads.length,
            change: `${leads.filter(l => l.status === 'new').length} new`,
            changeType: leads.filter(l => l.status === 'new').length > 0 ? 'positive' : 'neutral',
            icon: Users,
            color: 'from-green-500 to-emerald-500',
        },
        {
            name: 'Active Searches',
            value: searches.filter(s => s.status === 'active').length,
            change: `${searches.length} total`,
            changeType: 'neutral',
            icon: Search,
            color: 'from-orange-500 to-amber-500',
        },
    ]

    // Get recent companies (top 5 by job count)
    const recentCompanies = [...companies]
        .sort((a, b) => {
            const aJobs = (a.metadata as CompanyMetadata | null)?.jobCount || 0
            const bJobs = (b.metadata as CompanyMetadata | null)?.jobCount || 0
            return bJobs - aJobs
        })
        .slice(0, 5)

    // Get recent leads (top 4 by created date)
    const recentLeads = [...leads]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)

    // Get active searches
    const activeSearches = searches.slice(0, 3)

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-white/40" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Dashboard</h1>
                    <p className="text-sm text-white/40">Overview of your lead generation activity</p>
                </div>
                <Button size="sm" className="h-8 bg-white text-sm text-black hover:bg-white/90" asChild>
                    <Link href="/dashboard/searches">
                        <Plus className="mr-1.5 size-3.5" />
                        New Search
                    </Link>
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="text-2xl font-semibold text-white">{stat.value}</div>
                                    <div className="flex items-center gap-0.5 text-xs font-medium">
                                        {stat.changeType === 'positive' && (
                                            <ArrowUpRight className="size-3 text-green-400" />
                                        )}
                                        <span className={stat.changeType === 'positive' ? 'text-green-400' : 'text-white/40'}>
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-white/40">{stat.name}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Recent Companies */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    <div className="absolute -left-20 -top-20 size-40 rounded-full bg-blue-500/5 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                        <h2 className="text-sm font-medium text-white">Recent Companies</h2>
                        <Link
                            href="/dashboard/companies"
                            className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white">
                            View all
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>
                    <div className="relative p-3">
                        {recentCompanies.length > 0 ? (
                            <div className="space-y-1.5">
                                {recentCompanies.map((company) => {
                                    const metadata = company.metadata as CompanyMetadata | null
                                    const jobCount = metadata?.jobCount || 0

                                    return (
                                        <div
                                            key={company.id}
                                            className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2.5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                            <div className="flex items-center gap-3">
                                                {company.logoUrl ? (
                                                    <img
                                                        src={company.logoUrl}
                                                        alt={company.name}
                                                        className="size-8 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                                                        {company.name.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-white">{company.name}</span>
                                                        {company.industry && (
                                                            <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/40">{company.industry}</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-3 text-xs text-white/30">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="size-3" />
                                                            {jobCount} jobs
                                                        </span>
                                                        {company.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="size-3" />
                                                                {company.location}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {company.isEnriched ? (
                                                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                        <CheckCircle2 className="size-3" />
                                                        Enriched
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="h-7 bg-gradient-to-r from-purple-500 to-blue-500 px-2.5 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                                        <Sparkles className="mr-1 size-3" />
                                                        Enrich
                                                    </Button>
                                                )}
                                                <ChevronRight className="size-4 text-white/20" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                                    <Building2 className="size-4 text-white/30" />
                                </div>
                                <p className="mt-2 text-sm text-white/40">No companies found yet</p>
                                <p className="text-xs text-white/30">Run a search to discover companies</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Contacts */}
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                    <div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/5 blur-3xl" />
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                        <h2 className="text-sm font-medium text-white">Recent Contacts</h2>
                        <Link
                            href="/dashboard/leads"
                            className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white">
                            View all
                            <ExternalLink className="size-3" />
                        </Link>
                    </div>
                    <div className="relative p-3">
                        {recentLeads.length > 0 ? (
                            <div className="space-y-1.5">
                                {recentLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        className="group rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-xs font-medium text-white ring-1 ring-inset ring-white/10">
                                                {lead.firstName?.charAt(0) || ''}{lead.lastName?.charAt(0) || ''}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm font-medium text-white truncate">
                                                        {lead.firstName} {lead.lastName}
                                                    </span>
                                                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                                        lead.status === 'new'
                                                            ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                                                            : lead.status === 'contacted'
                                                            ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20'
                                                            : 'bg-purple-500/10 text-purple-400 ring-purple-500/20'
                                                    }`}>
                                                        {lead.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-white/40 truncate">{lead.title || 'No title'}</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-white/30">{formatDate(lead.createdAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {lead.email && <Mail className="size-3.5 text-white/30" />}
                                                {lead.linkedinUrl && <Linkedin className="size-3.5 text-blue-400/60" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                                    <Users className="size-4 text-white/30" />
                                </div>
                                <p className="mt-2 text-sm text-white/40">No contacts yet</p>
                                <p className="text-xs text-white/30">Enrich companies to find contacts</p>
                            </div>
                        )}
                        <Link
                            href="/dashboard/companies"
                            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 py-2.5 text-xs text-white/40 transition-colors hover:border-white/20 hover:text-white/60">
                            <Sparkles className="size-3.5" />
                            Enrich companies to find contacts
                        </Link>
                    </div>
                </div>
            </div>

            {/* Active Searches */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="absolute -right-32 -top-32 size-64 rounded-full bg-orange-500/5 blur-3xl" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <h2 className="text-sm font-medium text-white">Your Searches</h2>
                    <Link
                        href="/dashboard/searches"
                        className="flex items-center gap-1 text-xs text-white/40 transition-colors hover:text-white">
                        Manage
                        <ExternalLink className="size-3" />
                    </Link>
                </div>
                <div className="relative p-3">
                    {activeSearches.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {activeSearches.map((search) => {
                                const filters = search.filters as SearchFilters | null

                                return (
                                    <div
                                        key={search.id}
                                        className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <div className="text-sm font-medium text-white truncate">{search.name}</div>
                                            </div>
                                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                                                search.status === 'active'
                                                    ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                                                    : 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                                            }`}>
                                                {search.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            <div className="rounded-md bg-white/5 px-2 py-1.5 text-center">
                                                <div className="text-sm font-medium text-white">{search.resultsCount || 0}</div>
                                                <div className="text-[10px] text-white/30">Companies</div>
                                            </div>
                                            <div className="rounded-md bg-white/5 px-2 py-1.5 text-center">
                                                <div className="text-sm font-medium text-white">
                                                    {filters?.jobTitles?.length || 0}
                                                </div>
                                                <div className="text-[10px] text-white/30">Job Titles</div>
                                            </div>
                                        </div>
                                        <div className="mt-2 space-y-0.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1 text-white/30">
                                                    <Clock className="size-3" />
                                                    Last run
                                                </span>
                                                <span className="text-white/50">{formatDate(search.lastRunAt)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="flex items-center gap-1 text-white/30">
                                                    <Calendar className="size-3" />
                                                    Created
                                                </span>
                                                <span className="text-white/50">{formatDate(search.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                                <Search className="size-4 text-white/30" />
                            </div>
                            <p className="mt-2 text-sm text-white/40">No searches yet</p>
                            <p className="text-xs text-white/30">Create a search to start finding companies</p>
                            <Link href="/dashboard/searches">
                                <Button className="mt-3 h-8 bg-white text-sm text-black hover:bg-white/90">
                                    <Plus className="mr-1.5 size-3.5" />
                                    Create Search
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] backdrop-blur-sm">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="relative border-b border-white/5 px-4 py-3">
                    <h2 className="text-sm font-medium text-white">Quick Actions</h2>
                </div>
                <div className="relative p-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: Search, title: 'New Search', desc: 'Start scraping jobs', gradient: 'from-blue-500 to-cyan-500', href: '/dashboard/searches' },
                            { icon: Sparkles, title: 'Enrich Companies', desc: 'Find key contacts', gradient: 'from-purple-500 to-pink-500', href: '/dashboard/companies' },
                            { icon: Users, title: 'View Contacts', desc: `${leads.length} contacts`, gradient: 'from-green-500 to-emerald-500', href: '/dashboard/leads' },
                            { icon: Building2, title: 'View Companies', desc: `${companies.length} companies`, gradient: 'from-orange-500 to-amber-500', href: '/dashboard/companies' },
                        ].map((action, index) => (
                            <Link
                                key={index}
                                href={action.href}
                                className="group relative flex items-center gap-3 overflow-hidden rounded-lg border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                <div className={`flex size-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient} shadow-lg transition-transform group-hover:scale-105`}>
                                    <action.icon className="size-5 text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{action.title}</div>
                                    <div className="text-xs text-white/40">{action.desc}</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
