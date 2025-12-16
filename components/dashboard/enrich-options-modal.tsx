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
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0f]/95">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex shrink-0 items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                            <Sparkles className="size-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-black dark:text-white">
                                {isBulk ? `Enrich ${companyCount} Companies` : 'Enrich Company'}
                            </h2>
                            <p className="text-xs text-black/40 dark:text-white/40">
                                Fetch company data & employees
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-1.5 text-black/40 transition-colors hover:bg-black/10 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 p-4 space-y-4">
                    {/* Company Info */}
                    {isBulk ? (
                        <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-bold ring-1 ring-inset ring-purple-500/20">
                                <Building2 className="size-5 text-purple-500 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-black dark:text-white">{companyCount} Companies Selected</div>
                                <div className="text-xs text-black/40 dark:text-white/40">Ready to enrich</div>
                            </div>
                        </div>
                    ) : company && (
                        <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-black/10 to-black/5 text-sm font-bold text-black ring-1 ring-inset ring-black/10 dark:from-white/10 dark:to-white/5 dark:text-white dark:ring-white/10">
                                {company.logo}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-black dark:text-white">{company.name}</div>
                                <div className="text-xs text-black/40 dark:text-white/40">Ready to enrich</div>
                            </div>
                        </div>
                    )}

                    {/* What will be fetched */}
                    <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                        <h3 className="mb-3 text-xs font-medium text-black dark:text-white">What you&apos;ll get</h3>
                        <div className="space-y-2.5">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
                                    <Globe className="size-4 text-blue-500 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-black dark:text-white">Company Information</div>
                                    <div className="text-[10px] text-black/40 dark:text-white/40">Industry, size, location, website & more</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10">
                                    <Users className="size-4 text-purple-500 dark:text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-black dark:text-white">Employee Contacts</div>
                                    <div className="text-[10px] text-black/40 dark:text-white/40">Names, titles, emails & LinkedIn profiles</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10">
                                    <Zap className="size-4 text-cyan-500 dark:text-cyan-400" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-black dark:text-white">Filter & Convert</div>
                                    <div className="text-[10px] text-black/40 dark:text-white/40">Browse in People tab, then add to Leads</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative border-t border-black/5 bg-black/[0.02] px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]">
                    {/* Credit estimate */}
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-cyan-500/10 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-3 text-cyan-500 dark:text-cyan-400" />
                            <span className="text-xs text-black/70 dark:text-white/70">Enrichment cost</span>
                        </div>
                        <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">{estimatedCredits} {estimatedCredits === 1 ? 'credit' : 'credits'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-7 px-2 text-xs text-black/40 hover:bg-black/10 hover:text-black dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleEnrich}
                            className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 px-4 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                            <Sparkles className="mr-1.5 size-3" />
                            {isBulk ? `Enrich ${companyCount} Companies` : 'Enrich Company'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
