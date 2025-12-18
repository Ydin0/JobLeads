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
        <div className="relative flex min-h-screen bg-[#FAFAFA] dark:bg-[#0a0a0f]">
            <DashboardSidebar />
            <div className="relative flex flex-1 flex-col lg:pl-64">
                <DashboardHeader />
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    )
}
