'use client'

import { Bell, Menu, Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DashboardHeader() {
    return (
        <header className="sticky top-0 z-40 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl">
            <div className="flex h-14 items-center gap-4 px-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/50 hover:bg-white/5 hover:text-white lg:hidden"
                    aria-label="Open menu">
                    <Menu className="size-5" />
                </Button>

                <div className="flex flex-1 items-center gap-4">
                    <div className="group relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30 transition-colors group-focus-within:text-white/50" />
                        <input
                            type="search"
                            placeholder="Search leads, companies..."
                            className="h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-4 text-sm text-white placeholder:text-white/30 transition-all focus:border-white/20 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-white/10"
                        />
                        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 text-xs text-white/20 sm:flex">
                            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">
                                <Command className="inline size-3" />
                            </kbd>
                            <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">K</kbd>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="relative text-white/50 hover:bg-white/5 hover:text-white"
                        aria-label="Notifications">
                        <Bell className="size-5" />
                        <span className="absolute right-1.5 top-1.5 flex size-2">
                            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                        </span>
                    </Button>

                    <div className="ml-2 flex items-center gap-3">
                        <div className="relative size-8 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-blue-500 ring-2 ring-white/10">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
