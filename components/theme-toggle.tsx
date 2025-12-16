'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <button className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50',
                className
            )}>
                <Sun className="size-4" />
                <span>Theme</span>
            </button>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'text-foreground/50 hover:bg-foreground/5 hover:text-foreground/80',
                className
            )}
        >
            {theme === 'dark' ? (
                <>
                    <Sun className="size-4" />
                    <span>Light Mode</span>
                </>
            ) : (
                <>
                    <Moon className="size-4" />
                    <span>Dark Mode</span>
                </>
            )}
        </button>
    )
}
