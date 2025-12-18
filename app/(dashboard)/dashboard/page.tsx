'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
    Target,
    Building2,
    Plus,
    Sparkles,
    CheckCircle2,
    UserPlus,
    Clock,
    Loader2,
    Users,
    Crown,
    Mail,
    TrendingUp,
    Lightbulb,
    ArrowRight,
    AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useSearches } from '@/hooks/use-searches'
import { useCompanies } from '@/hooks/use-companies'
import { useLeads } from '@/hooks/use-leads'
import { useCredits } from '@/hooks/use-credits'
import { useUser, useOrganization } from '@clerk/nextjs'

interface CompanyMetadata {
    linkedinId?: string
    jobCount?: number
}

export default function DashboardPage() {
    const { searches, isLoading: searchesLoading } = useSearches()
    const { companies, isLoading: companiesLoading } = useCompanies()
    const { leads, isLoading: leadsLoading } = useLeads()
    const { enrichmentRemaining, icpRemaining, isLoading: creditsLoading } = useCredits()
    const { user } = useUser()
    const { memberships } = useOrganization({
        memberships: {
            infinite: true,
        },
    })

    const isLoading = searchesLoading || companiesLoading || leadsLoading || creditsLoading

    // ICPs are searches in this app
    const icps = searches

    // Calculate stats
    const totalCompanies = companies.length
    const totalContacts = leads.length
    const activeSearches = searches.filter(s => s.status === 'active').length

    // Credits from API
    const enrichmentCreditsRemaining = enrichmentRemaining
    const icpCreditsRemaining = icpRemaining

    // Get recent activity from leads and searches
    const recentActivity = generateRecentActivity(leads, searches, companies)

    // Generate AI suggestions based on real data
    const aiSuggestions = useMemo(() => generateAISuggestions(
        companies,
        leads,
        searches,
        { enrichmentRemaining: enrichmentCreditsRemaining, icpRemaining: icpCreditsRemaining }
    ), [companies, leads, searches, enrichmentCreditsRemaining, icpCreditsRemaining])

    // Get team members
    const teamMembers = memberships?.data || []

    const formatTimeAgo = (date: Date | string | null) => {
        if (!date) return 'Never'
        const d = new Date(date)
        const now = new Date()
        const diff = now.getTime() - d.getTime()
        const minutes = Math.floor(diff / (1000 * 60))
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days}d ago`
        return d.toLocaleDateString()
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-black/40 dark:text-white/40" />
            </div>
        )
    }

    return (
        <div className="flex min-h-[calc(100vh-120px)] flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-semibold text-black dark:text-white">Dashboard</h1>
                    <p className="text-sm text-black/50 dark:text-white/50">
                        Overview of your lead generation pipeline
                    </p>
                </div>
                <Link href="/dashboard/icps/new">
                    <Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                        <Plus className="mr-2 size-4" />
                        Create New ICP
                    </Button>
                </Link>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 border-b border-black/5 pb-5 dark:border-white/5">
                <div>
                    <div className="text-2xl font-semibold text-black dark:text-white">{icps.length}</div>
                    <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">ICPs</div>
                </div>
                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-2xl font-semibold text-black dark:text-white">{totalCompanies}</div>
                    <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">Companies</div>
                </div>
                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-2xl font-semibold text-black dark:text-white">{totalContacts}</div>
                    <div className="mt-0.5 text-xs text-black/50 dark:text-white/50">Contacts</div>
                </div>
            </div>

            {/* Main Content - Two column layout that fills viewport */}
            <div className="grid flex-1 gap-5 lg:grid-cols-[1fr_300px]">
                {/* Left Column - ICP Pipeline + AI Suggestions */}
                <div className="flex flex-col gap-5">
                    {/* ICP Pipeline */}
                    <div>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-medium text-black dark:text-white">ICP Pipeline</h2>
                            <Link
                                href="/dashboard/icps"
                                className="text-xs text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                            >
                                View all
                            </Link>
                        </div>

                        {icps.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {icps.slice(0, 6).map((icp) => (
                                    <Link
                                        key={icp.id}
                                        href={`/dashboard/icps/${icp.id}`}
                                        className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                                                <Target className="size-5 text-black/60 dark:text-white/60" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-medium text-black truncate dark:text-white">{icp.name}</h3>
                                                <p className="text-xs text-black/40 dark:text-white/40">
                                                    {formatTimeAgo(icp.lastRunAt)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-3 text-xs">
                                            <div className="flex items-center gap-1">
                                                <Building2 className="size-3 text-black/30 dark:text-white/30" />
                                                <span className="font-medium text-black dark:text-white">{icp.resultsCount || 0}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="size-3 text-black/30 dark:text-white/30" />
                                                <span className="font-medium text-black dark:text-white">{icp.jobsCount || 0}</span>
                                            </div>
                                            <span className={cn(
                                                "ml-auto rounded-full px-2 py-0.5 text-[10px] font-medium",
                                                icp.status === 'active'
                                                    ? "bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                                                    : "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50"
                                            )}>
                                                {icp.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.01] py-16 text-center dark:border-white/10 dark:bg-white/[0.01]">
                                <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                    <Target className="size-6 text-black/30 dark:text-white/30" />
                                </div>
                                <p className="mt-4 text-sm font-medium text-black/60 dark:text-white/60">No ICPs yet</p>
                                <p className="mt-1 text-xs text-black/40 dark:text-white/40">Create your first ICP to start finding leads</p>
                            </div>
                        )}
                    </div>

                    {/* AI Suggestions - Fills remaining space with gradient border */}
                    <div className="flex-1 rounded-2xl bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[2px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                        <div className="h-full rounded-[14px] bg-white dark:bg-[#0a0a0f]">
                            <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/5">
                                <Sparkles className="size-4 text-violet-500" />
                                <h2 className="text-sm font-medium text-black dark:text-white">AI Suggestions</h2>
                                <span className="ml-1 rounded-full bg-gradient-to-r from-rose-100 to-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-600 dark:from-rose-500/20 dark:to-violet-500/20 dark:text-violet-400">
                                    Pro
                                </span>
                            </div>
                        <div className="p-4">
                            {aiSuggestions.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {aiSuggestions.map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                                                suggestion.priority === 'high'
                                                    ? "border-black/20 bg-black/[0.02] dark:border-white/20 dark:bg-white/[0.02]"
                                                    : "border-black/5 bg-black/[0.01] hover:border-black/10 dark:border-white/5 dark:bg-white/[0.01] dark:hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                                                {suggestion.type === 'action' && <ArrowRight className="size-4 text-black/60 dark:text-white/60" />}
                                                {suggestion.type === 'insight' && <TrendingUp className="size-4 text-black/60 dark:text-white/60" />}
                                                {suggestion.type === 'tip' && <Lightbulb className="size-4 text-black/60 dark:text-white/60" />}
                                                {suggestion.type === 'warning' && <AlertCircle className="size-4 text-black/60 dark:text-white/60" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-sm font-medium text-black dark:text-white">{suggestion.title}</p>
                                                    {suggestion.priority === 'high' && (
                                                        <span className="shrink-0 rounded-full bg-black px-1.5 py-0.5 text-[9px] font-medium text-white dark:bg-white dark:text-black">
                                                            Priority
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs leading-relaxed text-black/50 dark:text-white/50">{suggestion.description}</p>
                                                {suggestion.action && (
                                                    <Link
                                                        href={suggestion.action.href}
                                                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-black hover:underline dark:text-white"
                                                    >
                                                        {suggestion.action.label}
                                                        <ArrowRight className="size-3" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Sparkles className="size-8 text-black/20 dark:text-white/20" />
                                    <p className="mt-3 text-sm font-medium text-black/60 dark:text-white/60">No suggestions yet</p>
                                    <p className="mt-1 text-xs text-black/40 dark:text-white/40">Add ICPs and companies to get AI recommendations</p>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Recent Activity + Team */}
                <div className="flex flex-col gap-5">
                    {/* Recent Activity Feed - Fills available space */}
                    <div className="flex-1 rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="border-b border-black/5 px-4 py-3 dark:border-white/5">
                            <h2 className="text-sm font-medium text-black dark:text-white">Recent Activity</h2>
                        </div>
                        {recentActivity.length > 0 ? (
                            <div className="divide-y divide-black/5 dark:divide-white/5">
                                {recentActivity.slice(0, 8).map((activity) => (
                                    <div key={activity.id} className="flex items-start gap-3 px-4 py-3">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                                            {activity.type === 'search_completed' && <CheckCircle2 className="size-4 text-black/60 dark:text-white/60" />}
                                            {activity.type === 'companies_enriched' && <Sparkles className="size-4 text-black/60 dark:text-white/60" />}
                                            {activity.type === 'leads_added' && <UserPlus className="size-4 text-black/60 dark:text-white/60" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-black dark:text-white">{activity.title}</p>
                                            <p className="text-xs text-black/40 dark:text-white/40 truncate">
                                                {activity.description}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-xs text-black/40 dark:text-white/40">
                                            {formatTimeAgo(activity.timestamp)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Clock className="size-6 text-black/20 dark:text-white/20" />
                                <p className="mt-2 text-sm text-black/40 dark:text-white/40">No recent activity</p>
                            </div>
                        )}
                    </div>

                    {/* Team Section */}
                    <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/5">
                            <h2 className="text-sm font-medium text-black dark:text-white">Team</h2>
                            <Link
                                href="/dashboard/settings"
                                className="text-xs text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
                            >
                                Manage
                            </Link>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-full bg-black text-sm font-medium text-white dark:bg-white dark:text-black">
                                    {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-medium text-black truncate dark:text-white">
                                            {user?.fullName || user?.emailAddresses?.[0]?.emailAddress || 'You'}
                                        </p>
                                        <Crown className="size-3.5 text-amber-500" />
                                    </div>
                                    <p className="text-xs text-black/40 dark:text-white/40">Owner</p>
                                </div>
                            </div>

                            {teamMembers.length > 1 && (
                                <div className="mt-4 space-y-3">
                                    {teamMembers.slice(0, 3).filter(m => m.publicUserData?.userId !== user?.id).map((member) => (
                                        <div key={member.id} className="flex items-center gap-3">
                                            <div className="flex size-8 items-center justify-center rounded-full bg-black/5 text-xs font-medium text-black/60 dark:bg-white/5 dark:text-white/60">
                                                {member.publicUserData?.firstName?.charAt(0) || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-black truncate dark:text-white">
                                                    {member.publicUserData?.firstName} {member.publicUserData?.lastName}
                                                </p>
                                            </div>
                                            <span className="text-xs text-black/40 dark:text-white/40">
                                                {member.role}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/10 py-2.5 text-xs text-black/50 transition-colors hover:border-black/20 hover:text-black/70 dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/70">
                                <Mail className="size-3.5" />
                                Invite team member
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Helper function to generate activity from existing data
function generateRecentActivity(
    leads: Array<{ id: string; firstName: string; lastName: string; createdAt: Date | string }>,
    searches: Array<{ id: string; name: string; lastRunAt: Date | string | null; resultsCount: number | null }>,
    companies: Array<{ id: string; name: string; isEnriched: boolean | null; enrichedAt: Date | string | null }>
) {
    const activities: Array<{
        id: string
        type: 'search_completed' | 'companies_enriched' | 'leads_added'
        title: string
        description: string
        timestamp: Date | string
    }> = []

    // Add recent lead additions
    const recentLeads = leads
        .filter(l => l.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)

    if (recentLeads.length > 0) {
        activities.push({
            id: `leads-${recentLeads[0].id}`,
            type: 'leads_added',
            title: `${recentLeads.length} new contact${recentLeads.length > 1 ? 's' : ''}`,
            description: `${recentLeads[0].firstName} ${recentLeads[0].lastName}${recentLeads.length > 1 ? ` +${recentLeads.length - 1} more` : ''}`,
            timestamp: recentLeads[0].createdAt,
        })
    }

    // Add search completions
    const recentSearchRuns = searches
        .filter(s => s.lastRunAt)
        .sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime())
        .slice(0, 3)

    recentSearchRuns.forEach(search => {
        activities.push({
            id: `search-${search.id}`,
            type: 'search_completed',
            title: 'Scraper completed',
            description: `${search.name} · ${search.resultsCount || 0} companies`,
            timestamp: search.lastRunAt!,
        })
    })

    // Add recent enrichments
    const recentEnrichments = companies
        .filter(c => c.isEnriched && c.enrichedAt)
        .sort((a, b) => new Date(b.enrichedAt!).getTime() - new Date(a.enrichedAt!).getTime())
        .slice(0, 3)

    if (recentEnrichments.length > 0) {
        activities.push({
            id: `enrich-${recentEnrichments[0].id}`,
            type: 'companies_enriched',
            title: `${recentEnrichments.length} enriched`,
            description: recentEnrichments.map(c => c.name).slice(0, 2).join(', '),
            timestamp: recentEnrichments[0].enrichedAt!,
        })
    }

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// AI Suggestion types
interface AISuggestion {
    type: 'action' | 'insight' | 'tip' | 'warning'
    priority: 'high' | 'normal'
    title: string
    description: string
    action?: {
        label: string
        href: string
    }
}

// Generate AI suggestions based on user data
function generateAISuggestions(
    companies: Array<{ id: string; name: string; isEnriched: boolean | null; metadata?: unknown }>,
    leads: Array<{ id: string; firstName: string; lastName: string; jobTitle?: string | null }>,
    searches: Array<{ id: string; name: string; status: string; resultsCount: number | null }>,
    credits: { enrichmentRemaining: number; icpRemaining: number }
): AISuggestion[] {
    const suggestions: AISuggestion[] = []

    // Get companies with job postings (hiring signal)
    const companiesWithJobs = companies.filter(c => {
        const meta = c.metadata as { jobCount?: number } | null
        return meta?.jobCount && meta.jobCount > 0
    })

    // Get unenriched companies
    const unenrichedCompanies = companies.filter(c => !c.isEnriched)

    // 1. Credit warnings
    if (credits.enrichmentRemaining < 20) {
        suggestions.push({
            type: 'warning',
            priority: 'high',
            title: 'Low enrichment credits',
            description: `Only ${credits.enrichmentRemaining} enrichment credits remaining. Upgrade to continue enriching contacts.`,
            action: { label: 'Upgrade plan', href: '/dashboard/settings' }
        })
    }

    if (credits.icpRemaining < 100) {
        suggestions.push({
            type: 'warning',
            priority: 'high',
            title: 'Low ICP credits',
            description: `Only ${credits.icpRemaining} ICP credits remaining. Upgrade to find more companies.`,
            action: { label: 'Upgrade plan', href: '/dashboard/settings' }
        })
    }

    // 2. Action suggestions based on data
    if (unenrichedCompanies.length > 5 && credits.enrichmentRemaining > 10) {
        const topUnenriched = unenrichedCompanies.slice(0, 3).map(c => c.name).join(', ')
        suggestions.push({
            type: 'action',
            priority: 'high',
            title: `Enrich ${unenrichedCompanies.length} companies`,
            description: `${topUnenriched} and ${unenrichedCompanies.length - 3} more companies have hiring signals but no contact data yet.`,
            action: { label: 'View companies', href: '/dashboard/companies' }
        })
    }

    if (companiesWithJobs.length > 0) {
        const highJobCount = companiesWithJobs.filter(c => {
            const meta = c.metadata as { jobCount?: number } | null
            return meta?.jobCount && meta.jobCount >= 5
        })
        if (highJobCount.length > 0) {
            suggestions.push({
                type: 'insight',
                priority: 'high',
                title: `${highJobCount.length} companies are rapidly hiring`,
                description: `These companies have 5+ open positions - a strong buying signal. Consider prioritizing outreach to their decision makers.`,
                action: { label: 'View hot leads', href: '/dashboard/leads' }
            })
        }
    }

    // 3. Tips based on usage patterns
    if (searches.length === 0) {
        suggestions.push({
            type: 'tip',
            priority: 'normal',
            title: 'Create your first ICP',
            description: 'Define your ideal customer profile to start finding companies that match your target market.',
            action: { label: 'Create ICP', href: '/dashboard/icps/new' }
        })
    } else if (searches.length < 3) {
        suggestions.push({
            type: 'tip',
            priority: 'normal',
            title: 'Add more ICPs for better coverage',
            description: 'Companies typically have 3-5 ICPs. Adding more helps you discover different market segments.',
            action: { label: 'Create ICP', href: '/dashboard/icps/new' }
        })
    }

    if (leads.length > 0 && leads.length < 20) {
        suggestions.push({
            type: 'tip',
            priority: 'normal',
            title: 'Build your contact pipeline',
            description: `You have ${leads.length} contacts. Aim for 50+ contacts per ICP for effective outreach campaigns.`,
            action: { label: 'Find more contacts', href: '/dashboard/people' }
        })
    }

    // 4. Insights from data patterns
    if (companies.length > 10) {
        const enrichedPercent = Math.round((companies.filter(c => c.isEnriched).length / companies.length) * 100)
        if (enrichedPercent < 30) {
            suggestions.push({
                type: 'insight',
                priority: 'normal',
                title: `Only ${enrichedPercent}% of companies enriched`,
                description: 'Enriching more companies reveals decision-maker contacts and increases your outreach opportunities.',
                action: { label: 'Enrich companies', href: '/dashboard/companies' }
            })
        }
    }

    // Limit to 4 suggestions max, prioritize high priority ones
    return suggestions
        .sort((a, b) => (a.priority === 'high' ? -1 : 1) - (b.priority === 'high' ? -1 : 1))
        .slice(0, 4)
}
