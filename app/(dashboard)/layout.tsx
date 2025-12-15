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
        <div className="relative flex min-h-screen bg-[#050508]">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

                {/* Gradient orbs */}
                <div className="absolute -left-32 top-0 size-96 rounded-full bg-purple-500/10 blur-[128px]" />
                <div className="absolute -right-32 top-1/3 size-96 rounded-full bg-blue-500/10 blur-[128px]" />
                <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-cyan-500/5 blur-[128px]" />
            </div>

            <DashboardSidebar />
            <div className="relative flex flex-1 flex-col lg:pl-64">
                <DashboardHeader />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}
