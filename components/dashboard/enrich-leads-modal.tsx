'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Sparkles,
    Phone,
    User,
    Info,
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
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex shrink-0 items-center justify-between border-b border-white/5 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                            <Sparkles className="size-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">
                                {isBulk ? `Enrich ${leadCount} Leads` : 'Enrich Lead'}
                            </h2>
                            <p className="text-xs text-white/40">
                                {isBulk
                                    ? `Get full contact details for ${leadCount} selected leads`
                                    : `Get full contact details for ${lead?.firstName} ${lead?.lastName}`
                                }
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Lead Info */}
                    <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-bold text-white ring-1 ring-inset ring-white/10">
                            <User className="size-5 text-purple-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">
                                {isBulk ? `${leadCount} Leads Selected` : `${lead?.firstName} ${lead?.lastName}`}
                            </div>
                            <div className="text-xs text-white/40">
                                {isBulk
                                    ? `${leadsWithApolloId.length} can be enriched`
                                    : lead?.jobTitle || 'No job title'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Warning if some leads don't have Apollo IDs */}
                    {leadsWithoutApolloId.length > 0 && (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                            <div className="flex items-start gap-2">
                                <Info className="mt-0.5 size-4 text-amber-400 shrink-0" />
                                <div>
                                    <p className="text-xs font-medium text-amber-400">
                                        {leadsWithoutApolloId.length} lead{leadsWithoutApolloId.length > 1 ? 's' : ''} cannot be enriched
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-white/50">
                                        These leads were not originally found through Apollo search and don&apos;t have an Apollo ID.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Phone Number Option */}
                    <div>
                        <label className="mb-2 block text-xs font-medium text-white">
                            Enrichment Options
                        </label>
                        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2 space-y-0.5">
                            <button
                                onClick={() => setRevealPhoneNumber(!revealPhoneNumber)}
                                className={cn(
                                    'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left transition-all',
                                    revealPhoneNumber
                                        ? 'bg-purple-500/10 text-white'
                                        : 'text-white/60 hover:bg-white/5'
                                )}>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        'flex size-5 items-center justify-center rounded border transition-all',
                                        revealPhoneNumber
                                            ? 'border-purple-500 bg-purple-500'
                                            : 'border-white/20'
                                    )}>
                                        {revealPhoneNumber && (
                                            <Phone className="size-3 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-xs font-medium">Reveal Phone Numbers</span>
                                        <p className="text-[10px] text-white/40">+1 credit per lead with phone</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Credit Info Note */}
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 space-y-2">
                        <div className="flex items-start gap-2">
                            <Info className="mt-0.5 size-4 text-blue-400 shrink-0" />
                            <p className="text-[11px] text-white/50">
                                Credits are only consumed for successful enrichments. If a phone number is not found, that credit will not be charged.
                            </p>
                        </div>
                        {revealPhoneNumber && (
                            <div className="flex items-start gap-2">
                                <Phone className="mt-0.5 size-4 text-purple-400 shrink-0" />
                                <p className="text-[11px] text-white/50">
                                    Phone numbers are verified and delivered asynchronously. They will appear in a few minutes after enrichment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="relative border-t border-white/5 bg-white/[0.02] px-4 py-3">
                    {/* Credit estimate */}
                    <div className="mb-3 flex items-center justify-between rounded-lg bg-cyan-500/10 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-3 text-cyan-400" />
                            <span className="text-xs text-white/70">Estimated cost</span>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-medium text-cyan-400">{estimatedCredits} credits</span>
                            {phoneCredits > 0 && (
                                <p className="text-[10px] text-white/40">
                                    ({baseCredits} base + {phoneCredits} phone)
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleEnrich}
                            disabled={leadsWithApolloId.length === 0}
                            className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 px-4 text-xs text-white hover:from-purple-600 hover:to-blue-600 disabled:opacity-50">
                            <Sparkles className="mr-1.5 size-3" />
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
