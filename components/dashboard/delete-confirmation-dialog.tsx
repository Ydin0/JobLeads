'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2, X } from 'lucide-react'

interface DeleteConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    itemName: string
    stats?: {
        label: string
        value: number
    }[]
    onConfirm: () => Promise<void>
}

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    itemName,
    stats,
    onConfirm,
}: DeleteConfirmationDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    if (!open) return null

    const handleConfirm = async () => {
        setIsDeleting(true)
        try {
            await onConfirm()
            onOpenChange(false)
        } catch (error) {
            console.error('Delete failed:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => !isDeleting && onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
                            <AlertTriangle className="size-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-black dark:text-white">
                                {title}
                            </h2>
                        </div>
                    </div>
                    <button
                        onClick={() => !isDeleting && onOpenChange(false)}
                        disabled={isDeleting}
                        className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-50 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    <p className="text-sm text-black/70 dark:text-white/70">
                        {description}
                    </p>

                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                            Delete &quot;{itemName}&quot;?
                        </p>
                        {stats && stats.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                                <p className="text-xs text-red-600/80 dark:text-red-400/70">
                                    This will permanently delete:
                                </p>
                                <ul className="space-y-1">
                                    {stats.map((stat, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center gap-2 text-xs text-red-600/80 dark:text-red-400/70"
                                        >
                                            <span className="size-1 rounded-full bg-red-400 dark:bg-red-500" />
                                            {stat.value.toLocaleString()} {stat.label}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-black/5 bg-black/[0.02] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                        className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="h-9 rounded-full bg-red-600 px-5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
