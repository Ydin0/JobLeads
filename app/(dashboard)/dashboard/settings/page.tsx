'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    User,
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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PricingModal } from '@/components/dashboard/pricing-modal'
import { useCredits } from '@/hooks/use-credits'
import { useUser, useOrganization } from '@clerk/nextjs'

const tabs = [
    { id: 'general', name: 'General', icon: Building2 },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'billing', name: 'Billing', icon: CreditCard },
]

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general')
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

    const { user, isLoaded: userLoaded } = useUser()
    const { organization, memberships, isLoaded: orgLoaded } = useOrganization({
        memberships: { infinite: true },
    })

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
    const teamMembers = memberships?.data || []

    return (
        <div className="space-y-6">
            <PricingModal
                open={isPricingModalOpen}
                onOpenChange={setIsPricingModalOpen}
                currentPlan={credits?.plan.id || 'free'}
            />

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
                                        className="h-10 w-full rounded-lg border border-black/10 bg-white px-3 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                        Save Changes
                                    </Button>
                                </div>
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

                        {/* Danger Zone */}
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
                                <Button
                                    variant="outline"
                                    className="h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    Invite
                                </Button>
                            </div>
                            <div className="divide-y divide-black/5 dark:divide-white/5">
                                {/* Current user */}
                                <div className="flex items-center justify-between px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {user?.imageUrl ? (
                                            <img
                                                src={user.imageUrl}
                                                alt=""
                                                className="size-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex size-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white dark:bg-white dark:text-black">
                                                {user?.firstName?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-black dark:text-white">
                                                    {user?.fullName || 'You'}
                                                </p>
                                                <Crown className="size-3.5 text-amber-500" />
                                            </div>
                                            <p className="text-xs text-black/40 dark:text-white/40">
                                                {user?.primaryEmailAddress?.emailAddress}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                        Owner
                                    </span>
                                </div>

                                {/* Other members */}
                                {teamMembers
                                    .filter((m) => m.publicUserData?.userId !== user?.id)
                                    .map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between px-5 py-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-full bg-black/5 text-sm font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                                    {member.publicUserData?.firstName?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-black dark:text-white">
                                                        {member.publicUserData?.firstName}{' '}
                                                        {member.publicUserData?.lastName}
                                                    </p>
                                                    <p className="text-xs text-black/40 dark:text-white/40">
                                                        {member.publicUserData?.identifier}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-full bg-black/5 px-2.5 py-1 text-[10px] font-medium capitalize text-black/60 dark:bg-white/10 dark:text-white/60">
                                                {member.role}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            {/* Invite prompt */}
                            <div className="border-t border-black/5 px-5 py-4 dark:border-white/5">
                                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/10 py-3 text-xs text-black/50 transition-colors hover:border-black/20 hover:text-black/70 dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:text-white/70">
                                    <Mail className="size-4" />
                                    Invite team member
                                </button>
                            </div>
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
                                    <Button
                                        onClick={() => setIsPricingModalOpen(true)}
                                        className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                    >
                                        Upgrade Plan
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Credit Usage */}
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
                                {/* Enrichment Credits */}
                                <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Zap className="size-4 text-black/40 dark:text-white/40" />
                                            <span className="text-sm font-medium text-black dark:text-white">
                                                Enrichment Credits
                                            </span>
                                        </div>
                                        <span className="text-sm text-black/60 dark:text-white/60">
                                            {enrichmentUsed.toLocaleString()} / {enrichmentLimit.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-black dark:bg-white"
                                            style={{ width: `${Math.min(enrichmentPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-black/40 dark:text-white/40">
                                        {enrichmentRemaining.toLocaleString()} credits remaining
                                    </p>
                                </div>

                                {/* ICP Credits */}
                                <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Target className="size-4 text-black/40 dark:text-white/40" />
                                            <span className="text-sm font-medium text-black dark:text-white">
                                                ICP Credits
                                            </span>
                                        </div>
                                        <span className="text-sm text-black/60 dark:text-white/60">
                                            {icpUsed.toLocaleString()} / {icpLimit.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-black dark:bg-white"
                                            style={{ width: `${Math.min(icpPercentage, 100)}%` }}
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-black/40 dark:text-white/40">
                                        {icpRemaining.toLocaleString()} credits remaining
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
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
                    </>
                )}
            </div>
        </div>
    )
}
