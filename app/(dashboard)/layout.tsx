import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'

// Prevent static prerendering - these pages require Clerk auth context
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="relative flex min-h-screen bg-background">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(var(--theme-accent)_1px,transparent_1px),linear-gradient(90deg,var(--theme-accent)_1px,transparent_1px)] bg-[size:64px_64px] opacity-[0.02] dark:opacity-[0.03]" />

                {/* Gradient orbs - use CSS variables for theme-aware colors */}
                <div className="absolute -left-32 top-0 size-96 rounded-full bg-[var(--theme-accent-gradient-from)] opacity-[0.08] blur-[128px] dark:opacity-[0.1]" />
                <div className="absolute -right-32 top-1/3 size-96 rounded-full bg-[var(--theme-accent-gradient-to)] opacity-[0.08] blur-[128px] dark:opacity-[0.1]" />
                <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-[var(--theme-accent)] opacity-[0.04] blur-[128px] dark:opacity-[0.05]" />
            </div>

            <DashboardSidebar />
            <div className="relative flex flex-1 flex-col lg:pl-64">
                <DashboardHeader />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}
