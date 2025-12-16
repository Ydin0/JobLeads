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
} from 'lucide-react'
import { PricingModal } from './pricing-modal'

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Searches', href: '/dashboard/searches', icon: Search },
    { name: 'Companies', href: '/dashboard/companies', icon: Building2 },
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
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-white/5 bg-white/[0.02] backdrop-blur-xl lg:flex">
            {/* Subtle gradient overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] to-transparent" />

            <div className="relative flex h-14 items-center border-b border-white/5 px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image
                        src="/Group.svg"
                        alt="RecLead"
                        width={32}
                        height={32}
                        className="size-8"
                    />
                    <span className="text-lg font-bold">RecLead</span>
                </Link>
            </div>

            {/* Organization Switcher */}
            <div className="relative border-b border-white/5 px-3 py-3">
                <OrganizationSwitcher
                    hidePersonal
                    afterCreateOrganizationUrl="/dashboard"
                    afterSelectOrganizationUrl="/dashboard"
                    createOrganizationUrl="/onboarding/create-organization"
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            organizationSwitcherTrigger:
                                "w-full justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white hover:bg-white/10",
                            organizationPreviewMainIdentifier: "text-white text-sm font-medium",
                            organizationPreviewSecondaryIdentifier: "text-white/50",
                            organizationSwitcherTriggerIcon: "text-white/50",
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
                                            ? 'text-white'
                                            : 'text-white/50 hover:text-white/80'
                                    )}>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/10 to-white/5 ring-1 ring-inset ring-white/10" />
                                    )}
                                    <item.icon className={cn(
                                        "relative size-4 transition-colors",
                                        isActive ? "text-white" : "text-white/40 group-hover:text-white/60"
                                    )} />
                                    <span className="relative">{item.name}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                <div className="my-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

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
                                            ? 'text-white'
                                            : 'text-white/50 hover:text-white/80'
                                    )}>
                                    {isActive && (
                                        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/10 to-white/5 ring-1 ring-inset ring-white/10" />
                                    )}
                                    <item.icon className={cn(
                                        "relative size-4 transition-colors",
                                        isActive ? "text-white" : "text-white/40 group-hover:text-white/60"
                                    )} />
                                    <span className="relative">{item.name}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>

                <div className="mt-auto space-y-3">
                    {/* Upgrade Card */}
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 ring-1 ring-inset ring-white/10">
                        <div className="absolute -right-6 -top-6 size-24 rounded-full bg-purple-500/20 blur-2xl" />
                        <div className="relative">
                            <div className="mb-2 flex items-center gap-2">
                                <Sparkles className="size-4 text-purple-400" />
                                <span className="text-sm font-medium">Free Plan</span>
                            </div>
                            <div className="mb-3 text-xs text-white/50">
                                12 / 30 credits used
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full w-[40%] rounded-full bg-gradient-to-r from-purple-500 to-blue-500" />
                            </div>
                            <button
                                onClick={() => setIsPricingModalOpen(true)}
                                className="mt-3 block w-full text-center text-xs font-medium text-purple-400 transition-colors hover:text-purple-300">
                                Upgrade Plan →
                            </button>
                        </div>
                    </div>

                    <SignOutButton>
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80">
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
