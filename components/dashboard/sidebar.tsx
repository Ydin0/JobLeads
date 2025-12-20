'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    Settings,
    HelpCircle,
    LogOut,
    Sparkles,
    Contact,
    Target,
    Upload,
} from 'lucide-react'
import { PricingModal } from './pricing-modal'

// Navigation item type
interface NavItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    comingSoon?: boolean
}

interface NavSection {
    label: string
    items: NavItem[]
}

// Grouped navigation sections (Contra-style)
const navigationSections: NavSection[] = [
    {
        label: 'CORE',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'ICPs', href: '/dashboard/icps', icon: Target },
        ]
    },
    {
        label: 'LEADS',
        items: [
            { name: 'Prospects', href: '/dashboard/prospects', icon: Users, comingSoon: true },
            { name: 'Leads', href: '/dashboard/leads', icon: Contact, comingSoon: true },
        ]
    },
    {
        label: 'DATA',
        items: [
            { name: 'Import', href: '/dashboard/import', icon: Upload, comingSoon: true },
        ]
    },
    {
        label: 'SETTINGS',
        items: [
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
            { name: 'Help', href: '/dashboard/help', icon: HelpCircle },
        ]
    }
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
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-black/10 bg-white lg:flex dark:border-white/10 dark:bg-[#0a0a0f]">

            <div className="flex h-14 items-center border-b border-black/10 px-6 dark:border-white/10">
                <Link href="/dashboard">
                    <Image
                        src="/LogoLight.svg"
                        alt="RecLead"
                        width={120}
                        height={28}
                        className="h-7 w-auto dark:hidden"
                    />
                    <Image
                        src="/LogoDark.svg"
                        alt="RecLead"
                        width={120}
                        height={28}
                        className="hidden h-7 w-auto dark:block"
                    />
                </Link>
            </div>

            <nav className="flex flex-1 flex-col px-3 py-3">
                <div className="space-y-4">
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={section.label}>
                            {/* Section Label */}
                            <div className="px-3 py-1.5">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                                    {section.label}
                                </span>
                            </div>
                            {/* Section Items */}
                            <ul className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive = item.href === '/dashboard'
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href)

                                    // Coming soon items are not clickable
                                    if (item.comingSoon) {
                                        return (
                                            <li key={item.name}>
                                                <div className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-black/30 dark:text-white/30">
                                                    <item.icon className="size-4 text-black/20 dark:text-white/20" />
                                                    <span>{item.name}</span>
                                                    <span className="ml-auto rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/40 dark:bg-white/5 dark:text-white/40">
                                                        Soon
                                                    </span>
                                                </div>
                                            </li>
                                        )
                                    }

                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                                                    isActive
                                                        ? 'bg-[#F8F7FF] text-black dark:bg-white/10 dark:text-white'
                                                        : 'text-black/60 hover:bg-black/[0.02] hover:text-black dark:text-white/60 dark:hover:bg-white/[0.02] dark:hover:text-white'
                                                )}>
                                                <item.icon className={cn(
                                                    "size-4",
                                                    isActive ? "text-black dark:text-white" : "text-black/40 dark:text-white/40"
                                                )} />
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-auto space-y-3">
                    {/* Upgrade Card (Contra-style) */}
                    <div className="rounded-xl border border-black/5 bg-[#FAFAFA] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-4 text-black/40 dark:text-white/40" />
                            <span className="text-xs font-medium text-black/60 dark:text-white/60">
                                Free Plan
                            </span>
                        </div>
                        <p className="mt-2 text-[13px] font-medium text-black dark:text-white">
                            Unlock unlimited leads
                        </p>
                        <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                            Get advanced filters and CRM sync
                        </p>
                        <button
                            onClick={() => setIsPricingModalOpen(true)}
                            className="mt-3 w-full rounded-full bg-black py-2 text-xs font-medium text-white transition-colors hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            Upgrade to Pro
                        </button>
                    </div>

                    <SignOutButton>
                        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-black/50 transition-colors hover:bg-black/5 hover:text-black/70 dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white/70">
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
