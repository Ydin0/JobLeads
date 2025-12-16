'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignOutButton, OrganizationSwitcher } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Search,
    Users,
    Building2,
    Settings,
    HelpCircle,
    LogOut,
    Sparkles,
    Contact,
} from 'lucide-react'
import { PricingModal } from './pricing-modal'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Searches', href: '/dashboard/searches', icon: Search },
    { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
    { name: 'People', href: '/dashboard/people', icon: Contact },
    { name: 'Leads', href: '/dashboard/leads', icon: Users },
]

const secondaryNavigation = [
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
]

export function DashboardSidebar() {
    const pathname = usePathname()
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)

    return (
        <>
        <PricingModal
            open={isPricingModalOpen}
            onOpenChange={setIsPricingModalOpen}
            currentPlan="free"
        />
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl lg:flex">
            {/* Subtle gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/[0.02] to-transparent" />

            <div className="relative flex h-14 items-center border-b border-border px-6">
                <Link href="/dashboard">
                    <Image
                        src="/Group.svg"
                        alt="RecLead"
                        width={100}
                        height={24}
                        className="h-6 w-auto dark:invert-0 invert"
                    />
                </Link>
            </div>

            {/* Organization Switcher */}
            <div className="relative border-b border-border px-3 py-3">
                <OrganizationSwitcher
                    hidePersonal
                    afterCreateOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    createOrganizationUrl="/onboarding/create-organization"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            organizationSwitcherTrigger:
                                "w-full justify-between rounded-lg border border-border bg-background/50 px-3 py-2 hover:bg-background/80",
                            organizationPreviewMainIdentifier: "text-sm font-medium",
                            organizationPreviewSecondaryIdentifier: "text-muted-foreground",
                            organizationSwitcherTriggerIcon: "text-muted-foreground",
                        },
                    }}
                />
            </div>

            <nav className="relative flex flex-1 flex-col px-3 py-4">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'text-foreground'
                                            : 'text-muted-foreground hover:text-foreground/80'
                                    )}>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-lg bg-[var(--theme-accent-muted)] ring-1 ring-inset ring-[var(--theme-accent)]/20" />
                                    )}
                                    <item.icon className={cn(
                                        "relative size-4 transition-colors",
                                        isActive ? "text-[var(--theme-accent)]" : "text-muted-foreground group-hover:text-foreground/60"
                                    )} />
                                    <span className="relative">{item.name}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                <div className="my-4 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                <ul className="space-y-1">
                    {secondaryNavigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                        isActive
                                            ? 'text-foreground'
                                            : 'text-muted-foreground hover:text-foreground/80'
                                    )}>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-lg bg-[var(--theme-accent-muted)] ring-1 ring-inset ring-[var(--theme-accent)]/20" />
                                    )}
                                    <item.icon className={cn(
                                        "relative size-4 transition-colors",
                                        isActive ? "text-[var(--theme-accent)]" : "text-muted-foreground group-hover:text-foreground/60"
                                    )} />
                                    <span className="relative">{item.name}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                <div className="mt-auto space-y-3">
                    {/* Upgrade Card */}
                    <div className="relative overflow-hidden rounded-xl bg-[var(--theme-accent-muted)] p-4 ring-1 ring-inset ring-[var(--theme-accent)]/20">
                        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-[var(--theme-accent)]/20 blur-2xl" />
                        <div className="relative">
                            <div className="mb-2 flex items-center gap-2">
                                <Sparkles className="size-4 text-[var(--theme-accent)]" />
                                <span className="text-sm font-medium">Free Plan</span>
                            </div>
                            <div className="mb-3 text-xs text-muted-foreground">
                                12 / 30 credits used
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
                                <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-[var(--theme-accent-gradient-from)] to-[var(--theme-accent-gradient-to)]" />
                            </div>
                            <button
                                onClick={() => setIsPricingModalOpen(true)}
                                className="mt-3 block w-full text-center text-xs font-medium text-[var(--theme-accent)] transition-colors hover:text-[var(--theme-accent-light)]">
                                Upgrade Plan →
                            </button>
                        </div>
                    </div>

                    <SignOutButton>
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground/80">
                            <LogOut className="size-4" />
                            Sign Out
                        </button>
                    </SignOutButton>
                </div>
            </nav>
        </aside>
        </>
    )
}
