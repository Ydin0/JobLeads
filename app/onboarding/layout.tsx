import Image from 'next/image'
import Link from 'next/link'

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            {/* Background effects */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="relative border-b border-white/5">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link href="/">
                        <Image
                            src="/LogoDark.svg"
                            alt="RecLead"
                            width={100}
                            height={24}
                            className="h-6 w-auto"
                        />
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="relative">{children}</main>
        </div>
    )
}
