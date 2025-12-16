'use client'

import { Bell, Menu, Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'

export function DashboardHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur-xl">
            <div className="flex h-14 items-center gap-4 px-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground lg:hidden"
                    aria-label="Open menu">
                    <Menu className="size-5" />
                </Button>

                <div className="flex flex-1 items-center gap-4">
                    <div className="group relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search leads, companies..."
                            className="h-9 w-full rounded-lg border border-border bg-background/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-border focus:bg-background/80 focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs text-muted-foreground/50 sm:flex">
                            <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono">
                                <Command className="inline size-3" />
                            </kbd>
                            <kbd className="rounded border border-border bg-background/50 px-1.5 py-0.5 font-mono">K</kbd>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <ThemeToggle />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="relative text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        aria-label="Notifications">
                        <Bell className="size-5" />
                        <span className="absolute right-1.5 top-1.5 flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--theme-accent)] opacity-75"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-[var(--theme-accent)]"></span>
                        </span>
                    </Button>

                    <div className="ml-2">
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "size-8 ring-2 ring-border",
                                },
                            }}
                        />
                    </div>
                </div>
            </div>
        </header>
    )
}
