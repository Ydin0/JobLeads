'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    CreditCard,
    Building2,
    Users,
    Crown,
    Zap,
    Target,
    Mail,
    Trash2,
    Plus,
    Loader2,
    Settings2,
    Ban,
    Shield,
    History,
    ArrowDownRight,
    Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PricingModal } from '@/components/dashboard/pricing-modal'
import { MemberLimitsModal } from '@/components/dashboard/member-limits-modal'
import { InviteMemberModal } from '@/components/dashboard/invite-member-modal'
import { useCredits } from '@/hooks/use-credits'
import { useUser, useOrganization } from '@clerk/nextjs'

interface TeamMember {
    id: string
    userId: string
    role: 'owner' | 'admin' | 'member'
    joinedAt: string
    user: {
        email: string
        firstName: string | null
        lastName: string | null
        imageUrl: string | null
    }
    credits: {
        enrichment: {
            limit: number | null
            used: number
            remaining: number | null
        }
        icp: {
            limit: number | null
            used: number
            remaining: number | null
        }
    }
    isBlocked: boolean
    isCurrentUser: boolean
    canManage: boolean
}

interface Invitation {
    id: string
    emailAddress: string
    role: string
    status: string
    createdAt: number
}

const PLATFORM_ADMIN_ORG = 'Octogle Technologies'

interface AdminStats {
    total: number
    enriched: number
    unenriched: number
    withLinkedIn: number
    unenrichedWithLinkedIn: number
}

interface EnrichmentResult {
    total: number
    successful: number
    failed: number
    cacheHits: number
}

interface CreditHistoryItem {
    id: string
    creditType: 'enrichment' | 'icp'
    transactionType: string
    creditsUsed: number
    balanceAfter: number | null
    description: string | null
    metadata: {
        companiesReturned?: number
        employeesEnriched?: number
        scraperConfig?: { jobTitle: string; location: string }
    } | null
    createdAt: string
    user: {
        id: string
        firstName: string | null
        lastName: string | null
        email: string
        imageUrl: string | null
    }
    search: {
        id: string
        name: string
    } | null
}

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general')
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [isLoadingTeam, setIsLoadingTeam] = useState(true)
    const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false)

    // Platform admin state
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
    const [isLoadingAdminStats, setIsLoadingAdminStats] = useState(false)
    const [isRunningEnrichment, setIsRunningEnrichment] = useState(false)
    const [enrichmentResult, setEnrichmentResult] = useState<EnrichmentResult | null>(null)

    // Credit history state
    const [creditHistoryData, setCreditHistoryData] = useState<CreditHistoryItem[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(false)
    const [historyFilter, setHistoryFilter] = useState<'all' | 'enrichment' | 'icp'>('all')

    const { user, isLoaded: userLoaded } = useUser()
    const { organization, isLoaded: orgLoaded } = useOrganization()

    // Check if current org is the platform admin org
    const isPlatformAdmin = organization?.name === PLATFORM_ADMIN_ORG

    // Dynamic tabs based on platform admin status
    const tabs = [
        { id: 'general', name: 'General', icon: Building2 },
        { id: 'team', name: 'Team', icon: Users },
        { id: 'billing', name: 'Billing', icon: CreditCard },
        ...(isPlatformAdmin ? [{ id: 'admin', name: 'Platform Admin', icon: Shield }] : []),
    ]

    const {
        credits,
        isLoading: creditsLoading,
        enrichmentUsed,
        enrichmentLimit,
        enrichmentRemaining,
        icpUsed,
        icpLimit,
        icpRemaining,
        planName,
    } = useCredits()

    // Fetch team members
    const fetchTeamMembers = useCallback(async () => {
        try {
            setIsLoadingTeam(true)
            const response = await fetch('/api/team/members')
            if (response.ok) {
                const data = await response.json()
                setTeamMembers(data.members)
                setCurrentUserIsAdmin(data.currentUserIsAdmin)
            }
        } catch (error) {
            console.error('Failed to fetch team members:', error)
        } finally {
            setIsLoadingTeam(false)
        }
    }, [])

    // Fetch invitations
    const fetchInvitations = useCallback(async () => {
        try {
            const response = await fetch('/api/team/invitations')
            if (response.ok) {
                const data = await response.json()
                setInvitations(data.invitations.filter((inv: Invitation) => inv.status === 'pending'))
            }
        } catch (error) {
            console.error('Failed to fetch invitations:', error)
        }
    }, [])

    // Fetch platform admin stats
    const fetchAdminStats = useCallback(async () => {
        if (!isPlatformAdmin) return
        try {
            setIsLoadingAdminStats(true)
            const response = await fetch('/api/admin/bulk-enrich')
            if (response.ok) {
                const data = await response.json()
                setAdminStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch admin stats:', error)
        } finally {
            setIsLoadingAdminStats(false)
        }
    }, [isPlatformAdmin])

    // Fetch credit history
    const fetchCreditHistory = useCallback(async (filter: 'all' | 'enrichment' | 'icp' = 'all') => {
        try {
            setIsLoadingHistory(true)
            const url = filter === 'all'
                ? '/api/credits/history'
                : `/api/credits/history?type=${filter}`
            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setCreditHistoryData(data.history)
            }
        } catch (error) {
            console.error('Failed to fetch credit history:', error)
        } finally {
            setIsLoadingHistory(false)
        }
    }, [])

    // Run bulk enrichment
    const runBulkEnrichment = async () => {
        try {
            setIsRunningEnrichment(true)
            setEnrichmentResult(null)
            const response = await fetch('/api/admin/bulk-enrich', {
                method: 'POST',
            })
            if (response.ok) {
                const data = await response.json()
                setEnrichmentResult(data)
                // Refresh stats after enrichment
                await fetchAdminStats()
            } else {
                const error = await response.json()
                console.error('Enrichment failed:', error)
            }
        } catch (error) {
            console.error('Failed to run enrichment:', error)
        } finally {
            setIsRunningEnrichment(false)
        }
    }

    useEffect(() => {
        if (orgLoaded) {
            fetchTeamMembers()
            fetchInvitations()
        }
    }, [orgLoaded, fetchTeamMembers, fetchInvitations])

    // Fetch admin stats when switching to admin tab
    useEffect(() => {
        if (activeTab === 'admin' && isPlatformAdmin && !adminStats && !isLoadingAdminStats) {
            fetchAdminStats()
        }
    }, [activeTab, isPlatformAdmin, adminStats, isLoadingAdminStats, fetchAdminStats])

    // Fetch credit history when switching to billing tab
    useEffect(() => {
        if (activeTab === 'billing' && orgLoaded) {
            fetchCreditHistory(historyFilter)
        }
    }, [activeTab, orgLoaded, historyFilter, fetchCreditHistory])

    const handleInvite = async (email: string, role: 'admin' | 'member') => {
        const response = await fetch('/api/team/invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailAddress: email, role }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to send invitation')
        }

        await fetchInvitations()
    }

    const handleRevokeInvitation = async (invitationId: string) => {
        const response = await fetch(`/api/team/invitations?id=${invitationId}`, {
            method: 'DELETE',
        })

        if (response.ok) {
            setInvitations(invitations.filter((inv) => inv.id !== invitationId))
        }
    }

    const handleSaveMemberLimits = async (limits: {
        enrichmentLimit: number | null
        icpLimit: number | null
        isBlocked: boolean
    }) => {
        if (!selectedMember) return

        const response = await fetch(`/api/team/members/${selectedMember.userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(limits),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update member limits')
        }

        await fetchTeamMembers()
    }

    const isLoading = !userLoaded || !orgLoaded || creditsLoading

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="size-8 animate-spin text-black/40 dark:text-white/40" />
            </div>
        )
    }

    const enrichmentPercentage = enrichmentLimit > 0 ? (enrichmentUsed / enrichmentLimit) * 100 : 0
    const icpPercentage = icpLimit > 0 ? (icpUsed / icpLimit) * 100 : 0

    const getRoleBadgeStyle = (role: string, isBlocked: boolean) => {
        if (isBlocked) {
            return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
        }
        switch (role) {
            case 'owner':
                return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
            case 'admin':
                return 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400'
            default:
                return 'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60'
        }
    }

    return (
        <div className="space-y-6">
            <PricingModal
                open={isPricingModalOpen}
                onOpenChange={setIsPricingModalOpen}
                currentPlan={credits?.plan.id || 'free'}
            />

            <InviteMemberModal
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
                pendingInvitations={invitations}
                onInvite={handleInvite}
                onRevokeInvitation={handleRevokeInvitation}
            />

            {selectedMember && (
                <MemberLimitsModal
                    open={!!selectedMember}
                    onOpenChange={(open) => !open && setSelectedMember(null)}
                    member={selectedMember}
                    orgLimits={{
                        enrichmentLimit,
                        icpLimit,
                    }}
                    onSave={handleSaveMemberLimits}
                />
            )}

            {/* Header */}
            <div>
                <h1 className="text-lg font-semibold text-black dark:text-white">Settings</h1>
                <p className="text-sm text-black/50 dark:text-white/50">
                    Manage your organization and billing
                </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-black/5 dark:border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                            activeTab === tab.id
                                ? 'text-black dark:text-white'
                                : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                        )}
                    >
                        <tab.icon className="size-4" />
                        {tab.name}
                        {activeTab === tab.id && (
                            <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-black dark:bg-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="max-w-2xl space-y-6">
                {/* General Tab */}
                {activeTab === 'general' && (
                    <>
                        {/* Organization Info */}
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <h2 className="text-sm font-medium text-black dark:text-white">
                                    Organization
                                </h2>
                                <p className="text-xs text-black/50 dark:text-white/50">
                                    Manage your organization settings
                                </p>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="flex items-center gap-4">
                                    {organization?.imageUrl ? (
                                        <img
                                            src={organization.imageUrl}
                                            alt=""
                                            className="size-14 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-14 items-center justify-center rounded-lg bg-black text-xl font-bold text-white dark:bg-white dark:text-black">
                                            {organization?.name?.charAt(0) || 'O'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-black dark:text-white">
                                            {organization?.name || 'Organization'}
                                        </p>
                                        <p className="text-xs text-black/40 dark:text-white/40">
                                            {organization?.slug ? `@${organization.slug}` : 'No slug set'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-black dark:text-white">
                                        Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue={organization?.name || ''}
                                        disabled={!currentUserIsAdmin}
                                        className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                                    />
                                </div>

                                {currentUserIsAdmin && (
                                    <div className="flex justify-end">
                                        <Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Your Profile */}
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <h2 className="text-sm font-medium text-black dark:text-white">
                                    Your Profile
                                </h2>
                                <p className="text-xs text-black/50 dark:text-white/50">
                                    Your personal information
                                </p>
                            </div>
                            <div className="space-y-4 p-5">
                                <div className="flex items-center gap-4">
                                    {user?.imageUrl ? (
                                        <img
                                            src={user.imageUrl}
                                            alt=""
                                            className="size-12 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-12 items-center justify-center rounded-full bg-black text-lg font-bold text-white dark:bg-white dark:text-black">
                                            {user?.firstName?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-black dark:text-white">
                                            {user?.fullName || 'User'}
                                        </p>
                                        <p className="text-xs text-black/40 dark:text-white/40">
                                            {user?.primaryEmailAddress?.emailAddress || 'No email'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone - Only for admins */}
                        {currentUserIsAdmin && (
                            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5">
                                <div className="border-b border-red-200 px-5 py-4 dark:border-red-500/20">
                                    <h2 className="text-sm font-medium text-red-700 dark:text-red-400">
                                        Danger Zone
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-black dark:text-white">
                                                Delete Organization
                                            </p>
                                            <p className="text-xs text-black/50 dark:text-white/50">
                                                Permanently delete all data
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="h-8 rounded-full border-red-200 px-3 text-xs text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                                        >
                                            <Trash2 className="mr-1.5 size-3.5" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
                    <>
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <div>
                                    <h2 className="text-sm font-medium text-black dark:text-white">
                                        Team Members
                                    </h2>
                                    <p className="text-xs text-black/50 dark:text-white/50">
                                        {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {currentUserIsAdmin && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                                    >
                                        <Plus className="mr-1.5 size-3.5" />
                                        Invite
                                    </Button>
                                )}
                            </div>

                            {isLoadingTeam ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between px-5 py-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                {member.user.imageUrl ? (
                                                    <img
                                                        src={member.user.imageUrl}
                                                        alt=""
                                                        className="size-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-black/5 text-sm font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                                        {member.user.firstName?.charAt(0) || member.user.email.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium text-black dark:text-white">
                                                            {member.user.firstName
                                                                ? `${member.user.firstName} ${member.user.lastName || ''}`.trim()
                                                                : member.user.email}
                                                        </p>
                                                        {member.role === 'owner' && (
                                                            <Crown className="size-3.5 shrink-0 text-amber-500" />
                                                        )}
                                                        {member.role === 'admin' && (
                                                            <Shield className="size-3.5 shrink-0 text-violet-500" />
                                                        )}
                                                        {member.isBlocked && (
                                                            <Ban className="size-3.5 shrink-0 text-red-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                                                        <span className="truncate">{member.user.email}</span>
                                                        {member.credits.enrichment.limit !== null && (
                                                            <span className="shrink-0">
                                                                · {member.credits.enrichment.used}/{member.credits.enrichment.limit} credits
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2.5 py-1 text-[10px] font-medium capitalize',
                                                        getRoleBadgeStyle(member.role, member.isBlocked)
                                                    )}
                                                >
                                                    {member.isBlocked ? 'Blocked' : member.role}
                                                </span>
                                                {member.canManage && currentUserIsAdmin && (
                                                    <button
                                                        onClick={() => setSelectedMember(member)}
                                                        className="rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                                                        title="Set credit limits"
                                                    >
                                                        <Settings2 className="size-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Invite prompt - only for admins */}
                            {currentUserIsAdmin && (
                                <div className="border-t border-black/5 px-5 py-4 dark:border-white/5">
                                    <button
                                        onClick={() => setIsInviteModalOpen(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/10 py-3 text-xs text-black/50 transition-colors hover:border-black/20 hover:text-black/70 dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/70"
                                    >
                                        <Mail className="size-4" />
                                        Invite team member
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Billing Tab */}
                {activeTab === 'billing' && (
                    <>
                        {/* Current Plan */}
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <h2 className="text-sm font-medium text-black dark:text-white">
                                    Current Plan
                                </h2>
                            </div>
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-12 items-center justify-center rounded-xl bg-black dark:bg-white">
                                            <Crown className="size-6 text-white dark:text-black" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-semibold text-black dark:text-white">
                                                    {planName}
                                                </span>
                                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                                    Current
                                                </span>
                                            </div>
                                            <p className="text-xs text-black/40 dark:text-white/40">
                                                {credits?.plan.price === 0
                                                    ? 'Free forever'
                                                    : `$${credits?.plan.price}/month`}
                                            </p>
                                        </div>
                                    </div>
                                    {currentUserIsAdmin && (
                                        <Button
                                            onClick={() => setIsPricingModalOpen(true)}
                                            className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                        >
                                            Upgrade Plan
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Credit Usage with Gradient Styling */}
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <h2 className="text-sm font-medium text-black dark:text-white">
                                    Credit Usage
                                </h2>
                                <p className="text-xs text-black/50 dark:text-white/50">
                                    {credits?.billingCycle?.end
                                        ? `Resets ${new Date(credits.billingCycle.end).toLocaleDateString()}`
                                        : 'Resets monthly'}
                                </p>
                            </div>
                            <div className="space-y-4 p-5">
                                {/* Enrichment Credits with Gradient Border */}
                                <div className="rounded-xl bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                    <div className="rounded-xl bg-white p-4 dark:bg-[#0a0a0f]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                                                    <Zap className="size-4 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-black dark:text-white">
                                                        Enrichment Credits
                                                    </span>
                                                    <p className="text-[10px] text-black/40 dark:text-white/40">
                                                        For contact & company enrichment
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-semibold text-black dark:text-white">
                                                    {enrichmentRemaining.toLocaleString()}
                                                </span>
                                                <span className="text-sm text-black/40 dark:text-white/40">
                                                    {' '}/ {enrichmentLimit.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-black dark:bg-white"
                                                style={{ width: `${Math.min(100 - enrichmentPercentage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-black/40 dark:text-white/40">
                                            <span>{enrichmentUsed.toLocaleString()} used</span>
                                            <span>{enrichmentRemaining.toLocaleString()} remaining</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ICP Credits with Gradient Border */}
                                <div className="rounded-xl bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                                    <div className="rounded-xl bg-white p-4 dark:bg-[#0a0a0f]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                                                    <Target className="size-4 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-black dark:text-white">
                                                        ICP Credits
                                                    </span>
                                                    <p className="text-[10px] text-black/40 dark:text-white/40">
                                                        For company discovery via scrapers
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-semibold text-black dark:text-white">
                                                    {icpRemaining.toLocaleString()}
                                                </span>
                                                <span className="text-sm text-black/40 dark:text-white/40">
                                                    {' '}/ {icpLimit.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-black dark:bg-white"
                                                style={{ width: `${Math.min(100 - icpPercentage, 100)}%` }}
                                            />
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-xs text-black/40 dark:text-white/40">
                                            <span>{icpUsed.toLocaleString()} used</span>
                                            <span>{icpRemaining.toLocaleString()} remaining</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Credit History */}
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <History className="size-4 text-black/40 dark:text-white/40" />
                                    <h2 className="text-sm font-medium text-black dark:text-white">
                                        Credit History
                                    </h2>
                                </div>
                                {/* Filter tabs */}
                                <div className="flex items-center gap-1 rounded-lg bg-black/5 p-1 dark:bg-white/5">
                                    {(['all', 'enrichment', 'icp'] as const).map((filter) => (
                                        <button
                                            key={filter}
                                            onClick={() => setHistoryFilter(filter)}
                                            className={cn(
                                                'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors',
                                                historyFilter === filter
                                                    ? 'bg-white text-black shadow-sm dark:bg-white/10 dark:text-white'
                                                    : 'text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white'
                                            )}
                                        >
                                            {filter === 'all' ? 'All' : filter === 'enrichment' ? 'Enrichment' : 'ICP'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isLoadingHistory ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
                                </div>
                            ) : creditHistoryData.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                        <History className="size-5 text-black/30 dark:text-white/30" />
                                    </div>
                                    <p className="mt-3 text-sm text-black/50 dark:text-white/50">
                                        No credit activity yet
                                    </p>
                                    <p className="text-xs text-black/30 dark:text-white/30">
                                        Credit usage will appear here
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {creditHistoryData.map((item) => (
                                        <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
                                                {item.creditType === 'enrichment' ? (
                                                    <Zap className="size-3.5 text-violet-600 dark:text-violet-400" />
                                                ) : (
                                                    <Target className="size-3.5 text-violet-600 dark:text-violet-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-black dark:text-white">
                                                            {item.description || `${item.creditType === 'enrichment' ? 'Enrichment' : 'ICP'} credit usage`}
                                                        </p>
                                                        <div className="mt-0.5 flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                                                            <span>
                                                                {item.user.firstName
                                                                    ? `${item.user.firstName} ${item.user.lastName || ''}`.trim()
                                                                    : item.user.email}
                                                            </span>
                                                            {item.search && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Search className="size-3" />
                                                                        {item.search.name}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <div className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
                                                            <ArrowDownRight className="size-3" />
                                                            {item.creditsUsed}
                                                        </div>
                                                        <p className="text-[10px] text-black/30 dark:text-white/30">
                                                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Payment Method - Only for admins */}
                        {currentUserIsAdmin && (
                            <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                                <div className="border-b border-black/5 px-5 py-4 dark:border-white/5">
                                    <h2 className="text-sm font-medium text-black dark:text-white">
                                        Payment Method
                                    </h2>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-center rounded-lg border border-dashed border-black/10 py-8 dark:border-white/10">
                                        <div className="text-center">
                                            <CreditCard className="mx-auto size-8 text-black/20 dark:text-white/20" />
                                            <p className="mt-2 text-xs text-black/40 dark:text-white/40">
                                                No payment method on file
                                            </p>
                                            <Button
                                                variant="outline"
                                                className="mt-3 h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                                            >
                                                <Plus className="mr-1.5 size-3.5" />
                                                Add Payment Method
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Platform Admin Tab */}
                {activeTab === 'admin' && isPlatformAdmin && (
                    <>
                        {/* Company Enrichment */}
                        <div className="rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]">
                            <div className="border-b border-black/5 px-5 py-4 dark:border-white/5">
                                <h2 className="text-sm font-medium text-black dark:text-white">
                                    Company Enrichment
                                </h2>
                                <p className="text-xs text-black/50 dark:text-white/50">
                                    Platform-wide enrichment across all organizations
                                </p>
                            </div>

                            {isLoadingAdminStats ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
                                </div>
                            ) : adminStats ? (
                                <div className="p-5">
                                    {/* Stats Row */}
                                    <div className="flex items-center gap-8 border-b border-black/5 pb-5 dark:border-white/5">
                                        <div>
                                            <div className="text-3xl font-semibold text-black dark:text-white">
                                                {adminStats.total.toLocaleString()}
                                            </div>
                                            <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                                                Total Companies
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                                        <div>
                                            <div className="text-3xl font-semibold text-black dark:text-white">
                                                {adminStats.enriched.toLocaleString()}
                                            </div>
                                            <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                                                Enriched
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                                        <div>
                                            <div className="text-3xl font-semibold text-black dark:text-white">
                                                {adminStats.unenriched.toLocaleString()}
                                            </div>
                                            <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                                                Unenriched
                                            </div>
                                        </div>
                                        <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                                        <div>
                                            <div className="text-3xl font-semibold text-black dark:text-white">
                                                {adminStats.unenrichedWithLinkedIn.toLocaleString()}
                                            </div>
                                            <div className="mt-1 text-sm text-black/50 dark:text-white/50">
                                                Ready to Enrich
                                            </div>
                                        </div>
                                    </div>

                                    {/* Enrichment Action */}
                                    <div className="pt-5">
                                        {isRunningEnrichment ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="size-4 animate-spin text-black/40 dark:text-white/40" />
                                                    <span className="text-sm text-black/60 dark:text-white/60">
                                                        Enriching companies... This may take a few minutes.
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                                    <div className="h-full w-1/3 animate-pulse rounded-full bg-black dark:bg-white" />
                                                </div>
                                            </div>
                                        ) : enrichmentResult ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-8">
                                                    <div>
                                                        <div className="text-2xl font-semibold text-black dark:text-white">
                                                            {enrichmentResult.successful}
                                                        </div>
                                                        <div className="text-xs text-black/50 dark:text-white/50">
                                                            Successful
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-semibold text-black dark:text-white">
                                                            {enrichmentResult.cacheHits}
                                                        </div>
                                                        <div className="text-xs text-black/50 dark:text-white/50">
                                                            Cache Hits
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-semibold text-black dark:text-white">
                                                            {enrichmentResult.failed}
                                                        </div>
                                                        <div className="text-xs text-black/50 dark:text-white/50">
                                                            Failed
                                                        </div>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/60 dark:bg-white/5 dark:text-white/60">
                                                            Complete
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => setEnrichmentResult(null)}
                                                    variant="outline"
                                                    className="h-9 rounded-full border-black/10 px-4 text-sm dark:border-white/10"
                                                >
                                                    Dismiss
                                                </Button>
                                            </div>
                                        ) : adminStats.unenrichedWithLinkedIn > 0 ? (
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-black/60 dark:text-white/60">
                                                    {adminStats.unenrichedWithLinkedIn} companies ready for enrichment
                                                </p>
                                                <Button
                                                    onClick={runBulkEnrichment}
                                                    className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                                >
                                                    <Zap className="mr-2 size-4" />
                                                    Run Enrichment
                                                </Button>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-black/60 dark:text-white/60">
                                                All companies with LinkedIn URLs are enriched.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-12">
                                    <Button
                                        onClick={fetchAdminStats}
                                        variant="outline"
                                        className="h-9 rounded-full border-black/10 px-4 text-sm dark:border-white/10"
                                    >
                                        Load Stats
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <p className="text-xs text-black/40 dark:text-white/40">
                            Enrichment runs across all organizations. Results are cached in the global companies table.
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}
