'use client'

import { Bell, Menu, Search, Command, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'
import { useCredits } from '@/hooks/use-credits'
import Link from 'next/link'

export function DashboardHeader() {
    const { enrichmentRemaining, icpRemaining, isLoading } = useCredits()
    return (
        <header className="sticky top-0 z-40 border-b border-black/10 bg-white dark:border-white/10 dark:bg-[#0a0a0f]">
            <div className="flex h-14 items-center gap-4 px-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-black/50 hover:bg-black/5 hover:text-black lg:hidden dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                    aria-label="Open menu">
                    <Menu className="size-5" />
                </Button>

                <div className="flex flex-1 items-center gap-4">
                    <div className="group relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/30 transition-colors group-focus-within:text-black/50 dark:text-white/30 dark:group-focus-within:text-white/50" />
                        <input
                            type="search"
                            placeholder="Search leads, companies..."
                            className="h-9 w-full rounded-lg border border-black/10 bg-black/[0.02] pl-9 pr-4 text-sm text-black placeholder:text-black/40 transition-all focus:border-purple-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-200 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/40 dark:focus:border-purple-500/50 dark:focus:bg-white/5 dark:focus:ring-purple-500/20"
                        />
                        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs text-black/30 sm:flex dark:text-white/30">
                            <kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 font-mono dark:border-white/10 dark:bg-white/5">
                                <Command className="inline size-3" />
                            </kbd>
                            <kbd className="rounded border border-black/10 bg-white px-1.5 py-0.5 font-mono dark:border-white/10 dark:bg-white/5">K</kbd>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Credits Display */}
                    <Link href="/dashboard/settings" className="flex items-center gap-2">
                        <div className="rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                            <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 dark:bg-[#0a0a0f]">
                                <Zap className="size-3 text-violet-500" />
                                <span className="text-xs text-black/50 dark:text-white/50">Enrich</span>
                                <span className="text-xs font-semibold text-black dark:text-white">
                                    {isLoading ? '...' : enrichmentRemaining.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-full bg-gradient-to-r from-rose-200 via-purple-200 to-violet-300 p-[1px] dark:from-rose-400/40 dark:via-purple-400/40 dark:to-violet-400/40">
                            <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 dark:bg-[#0a0a0f]">
                                <Target className="size-3 text-violet-500" />
                                <span className="text-xs text-black/50 dark:text-white/50">ICP</span>
                                <span className="text-xs font-semibold text-black dark:text-white">
                                    {isLoading ? '...' : icpRemaining.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </Link>

                    <div className="mx-1 h-5 w-px bg-black/10 dark:bg-white/10" />

                    <ThemeToggle />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="relative text-black/50 hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                        aria-label="Notifications">
                        <Bell className="size-5" />
                        <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-purple-500" />
                    </Button>

                    <div className="ml-2">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "size-8 ring-2 ring-black/10 dark:ring-white/10",
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}
