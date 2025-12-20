'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ImportPage() {
    const router = useRouter()

    // Redirect after a short delay
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/dashboard')
        }, 3000)
        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-500/20 dark:to-purple-500/20">
                <Upload className="size-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="mt-6 text-xl font-semibold text-black dark:text-white">
                Import - Coming Soon
            </h1>
            <p className="mt-2 max-w-sm text-center text-sm text-black/50 dark:text-white/50">
                We&apos;re working on the import feature. You&apos;ll be able to upload CSV files and bulk import companies soon.
            </p>
            <p className="mt-4 text-xs text-black/30 dark:text-white/30">
                Redirecting to dashboard...
            </p>
            <Link href="/dashboard" className="mt-6">
                <Button
                    variant="outline"
                    className="h-9 rounded-full border-black/10 px-4 text-sm dark:border-white/10"
                >
                    <ArrowLeft className="mr-2 size-4" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
    )
}
