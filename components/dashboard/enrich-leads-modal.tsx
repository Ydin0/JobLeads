'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Sparkles,
    Phone,
    User,
    Info,
    Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Lead {
    id: string
    firstName: string
    lastName: string
    jobTitle?: string | null
    email?: string | null
    metadata?: {
        apolloId?: string
    } | null
}

interface EnrichLeadsModalProps {
    lead?: Lead | null
    leads?: Lead[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onEnrich: (options: LeadEnrichmentOptions) => void
}

export interface LeadEnrichmentOptions {
    revealPhoneNumber: boolean
}

export function EnrichLeadsModal({ lead, leads, open, onOpenChange, onEnrich }: EnrichLeadsModalProps) {
    const [revealPhoneNumber, setRevealPhoneNumber] = useState(false)

    const isBulk = leads && leads.length > 0
    const selectedLeads = isBulk ? leads : (lead ? [lead] : [])
    const leadCount = selectedLeads.length

    // Count leads with Apollo IDs
    const leadsWithApolloId = selectedLeads.filter(l => l.metadata?.apolloId)
    const leadsWithoutApolloId = selectedLeads.filter(l => !l.metadata?.apolloId)

    if (!open || leadCount === 0) return null

    const handleEnrich = () => {
        onEnrich({
            revealPhoneNumber,
        })
        onOpenChange(false)
    }

    // Credit calculation
    // Base: 1 credit per lead for email enrichment
    // Additional: 1 credit per lead if revealing phone numbers
    const baseCredits = leadsWithApolloId.length
    const phoneCredits = revealPhoneNumber ? leadsWithApolloId.length : 0
    const estimatedCredits = baseCredits + phoneCredits

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
                                {isBulk ? `Enrich ${leadCount} Leads` : 'Enrich Lead'}
                            </h2>
                            <p className="text-xs text-black/50 dark:text-white/50">
                                {isBulk
                                    ? `Get full contact details for ${leadCount} selected leads`
                                    : `Get full contact details for ${lead?.firstName} ${lead?.lastName}`
                                }
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
                    {/* Lead Info */}
                    <div className="flex items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                            <User className="size-5 text-black/60 dark:text-white/60" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-black dark:text-white">
                                {isBulk ? `${leadCount} Leads Selected` : `${lead?.firstName} ${lead?.lastName}`}
                            </div>
                            <div className="text-xs text-black/50 dark:text-white/50">
                                {isBulk
                                    ? `${leadsWithApolloId.length} can be enriched`
                                    : lead?.jobTitle || 'No job title'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Warning if some leads don't have Apollo IDs */}
                    {leadsWithoutApolloId.length > 0 && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                            <div className="flex items-start gap-2">
                                <Info className="mt-0.5 size-4 text-amber-600 shrink-0 dark:text-amber-400" />
                                <div>
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                        {leadsWithoutApolloId.length} lead{leadsWithoutApolloId.length > 1 ? 's' : ''} cannot be enriched
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400/70">
                                        These leads were not originally found through Apollo search and don&apos;t have an Apollo ID.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phone Number Option */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-black dark:text-white">
                            Enrichment Options
                        </label>
                        <button
                            onClick={() => setRevealPhoneNumber(!revealPhoneNumber)}
                            className={cn(
                                'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                                revealPhoneNumber
                                    ? 'border-black bg-black/5 dark:border-white dark:bg-white/5'
                                    : 'border-black/5 hover:border-black/10 hover:bg-black/[0.02] dark:border-white/5 dark:hover:border-white/10 dark:hover:bg-white/[0.02]'
                            )}>
                            <div className={cn(
                                'flex size-5 items-center justify-center rounded border transition-all',
                                revealPhoneNumber
                                    ? 'border-black bg-black dark:border-white dark:bg-white'
                                    : 'border-black/20 dark:border-white/20'
                            )}>
                                {revealPhoneNumber && (
                                    <Check className="size-3 text-white dark:text-black" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-medium text-black dark:text-white">
                                    Reveal Phone Numbers
                                    <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                        +1 credit/lead
                                    </span>
                                </div>
                                <p className="text-[10px] text-black/50 dark:text-white/50">Get mobile/direct phone numbers</p>
                            </div>
                            <Phone className="size-4 text-black/30 dark:text-white/30" />
                        </button>
                    </div>

                    {/* Credit Info Note */}
                    <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 space-y-2 dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="flex items-start gap-2">
                            <Info className="mt-0.5 size-4 text-black/40 shrink-0 dark:text-white/40" />
                            <p className="text-[11px] text-black/50 dark:text-white/50">
                                Credits are only consumed for successful enrichments. If a phone number is not found, that credit will not be charged.
                            </p>
                        </div>
                        {revealPhoneNumber && (
                            <div className="flex items-start gap-2">
                                <Phone className="mt-0.5 size-4 text-black/40 shrink-0 dark:text-white/40" />
                                <p className="text-[11px] text-black/50 dark:text-white/50">
                                    Phone numbers are verified and delivered asynchronously. They will appear in a few minutes after enrichment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-black/5 bg-black/[0.02] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    {/* Credit estimate */}
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-3 text-black/40 dark:text-white/40" />
                            <span className="text-xs text-black/60 dark:text-white/60">Estimated cost</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-medium text-black dark:text-white">{estimatedCredits} credits</span>
                            {phoneCredits > 0 && (
                                <p className="text-[10px] text-black/40 dark:text-white/40">
                                    ({baseCredits} base + {phoneCredits} phone)
                                </p>
                            )}
                        </div>
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
                            disabled={leadsWithApolloId.length === 0}
                            className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            <Sparkles className="mr-2 size-4" />
                            {leadsWithApolloId.length === 0
                                ? 'No Leads to Enrich'
                                : isBulk
                                    ? `Enrich ${leadsWithApolloId.length} Leads`
                                    : 'Enrich Lead'
                            }
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
