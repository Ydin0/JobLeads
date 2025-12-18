'use client'

import { Button } from '@/components/ui/button'
import {
    X,
    Sparkles,
    Building2,
    Users,
    Globe,
    Zap,
} from 'lucide-react'

interface Company {
    id: string
    name: string
    logo: string
}

interface EnrichOptionsModalProps {
    company?: Company | null
    companies?: Company[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onEnrich: () => void
}

export function EnrichOptionsModal({ company, companies, open, onOpenChange, onEnrich }: EnrichOptionsModalProps) {
    const isBulk = companies && companies.length > 0
    const companyCount = isBulk ? companies.length : 1

    if (!open || (!company && !isBulk)) return null

    const handleEnrich = () => {
        onEnrich()
        onOpenChange(false)
    }

    // Credit calculation: 1 credit per company for enrichment
    const estimatedCredits = companyCount

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                            <Sparkles className="size-4 text-black dark:text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-black dark:text-white">
                                {isBulk ? `Enrich ${companyCount} Companies` : 'Enrich Company'}
                            </h2>
                            <p className="text-xs text-black/50 dark:text-white/50">
                                Fetch company data & employees
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Company Info */}
                    {isBulk ? (
                        <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                <Building2 className="size-5 text-black/60 dark:text-white/60" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-black dark:text-white">{companyCount} Companies Selected</div>
                                <div className="text-xs text-black/50 dark:text-white/50">Ready to enrich</div>
                            </div>
                        </div>
                    ) : company && (
                        <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex size-10 items-center justify-center rounded-full bg-black/5 text-sm font-semibold text-black dark:bg-white/5 dark:text-white">
                                {company.logo}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-black dark:text-white">{company.name}</div>
                                <div className="text-xs text-black/50 dark:text-white/50">Ready to enrich</div>
                            </div>
                        </div>
                    )}

                    {/* What will be fetched */}
                    <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <h3 className="mb-3 text-xs font-medium text-black dark:text-white">What you&apos;ll get</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                    <Globe className="size-4 text-black/60 dark:text-white/60" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-black dark:text-white">Company Information</div>
                                    <div className="text-[11px] text-black/50 dark:text-white/50">Industry, size, location, website & more</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                    <Users className="size-4 text-black/60 dark:text-white/60" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-black dark:text-white">Employee Contacts</div>
                                    <div className="text-[11px] text-black/50 dark:text-white/50">Names, titles, emails & LinkedIn profiles</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                                    <Zap className="size-4 text-black/60 dark:text-white/60" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-black dark:text-white">Filter & Convert</div>
                                    <div className="text-[11px] text-black/50 dark:text-white/50">Browse in People tab, then add to Leads</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-black/5 bg-black/[0.02] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    {/* Credit estimate */}
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-3 text-black/40 dark:text-white/40" />
                            <span className="text-xs text-black/60 dark:text-white/60">Enrichment cost</span>
                        </div>
                        <span className="text-xs font-medium text-black dark:text-white">{estimatedCredits} {estimatedCredits === 1 ? 'credit' : 'credits'}</span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEnrich}
                            className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            <Sparkles className="mr-2 size-4" />
                            {isBulk ? `Enrich ${companyCount} Companies` : 'Enrich Company'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
