'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
    Mail,
    Phone,
    Copy,
    Check,
    Linkedin,
    ChevronDown,
    ChevronUp,
    Loader2,
    PhoneCall,
} from 'lucide-react'
import type { LeadWithCompany } from '@/hooks/use-crm-leads'
import { toast } from 'sonner'

interface ContactsListProps {
    leads: LeadWithCompany[]
    maxVisible?: number
    onStatusChange?: (leadId: string, status: string) => void
    onLeadUpdate?: (leadId: string, updates: Partial<LeadWithCompany>) => void
}

const statusColors: Record<string, { bg: string; text: string; ring: string }> = {
    new: {
        bg: 'bg-blue-500/10 dark:bg-blue-500/10',
        text: 'text-blue-600 dark:text-blue-400',
        ring: 'ring-blue-500/20',
    },
    contacted: {
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/10',
        text: 'text-yellow-600 dark:text-yellow-400',
        ring: 'ring-yellow-500/20',
    },
    qualified: {
        bg: 'bg-green-500/10 dark:bg-green-500/10',
        text: 'text-green-600 dark:text-green-400',
        ring: 'ring-green-500/20',
    },
    rejected: {
        bg: 'bg-red-500/10 dark:bg-red-500/10',
        text: 'text-red-600 dark:text-red-400',
        ring: 'ring-red-500/20',
    },
}

function CopyButton({ text, label }: { text: string; label: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="rounded p-1 text-black/30 transition-colors hover:bg-black/5 hover:text-black/60 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white"
            title={`Copy ${label}`}
        >
            {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
        </button>
    )
}

function ContactRow({
    lead,
    onStatusChange,
    onLeadUpdate,
}: {
    lead: LeadWithCompany
    onStatusChange?: (leadId: string, status: string) => void
    onLeadUpdate?: (leadId: string, updates: Partial<LeadWithCompany>) => void
}) {
    const [isFetchingPhone, setIsFetchingPhone] = useState(false)
    const status = lead.status || 'new'
    const colors = statusColors[status] || statusColors.new
    const metadata = lead.metadata as Record<string, unknown> | null
    const phonePending = metadata?.phonePending as boolean | undefined
    const hasApolloId = !!metadata?.apolloId

    const handleFetchPhone = async () => {
        if (isFetchingPhone || lead.phone) return

        setIsFetchingPhone(true)
        try {
            const response = await fetch(`/api/leads/${lead.id}/fetch-phone`, {
                method: 'POST',
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch phone')
            }

            if (data.phone) {
                if (data.isCompanyPhone) {
                    toast.success('Company phone found (personal phone not available)')
                } else {
                    toast.success('Phone number found!')
                }
                onLeadUpdate?.(lead.id, { phone: data.phone })
            } else if (data.localDevWarning) {
                toast.warning('Webhook URL points to production. Set APOLLO_WEBHOOK_URL in .env.local for local dev.', {
                    duration: 6000,
                })
            } else if (data.pending) {
                toast.info('Phone lookup initiated. Will appear shortly.')
                onLeadUpdate?.(lead.id, {
                    metadata: { ...metadata, phonePending: true },
                } as Partial<LeadWithCompany>)
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to fetch phone')
        } finally {
            setIsFetchingPhone(false)
        }
    }

    return (
        <div className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
            {/* Contact Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-black dark:text-white">
                        {lead.firstName} {lead.lastName}
                    </span>
                    <span
                        className={cn(
                            'rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                            colors.bg,
                            colors.text,
                            colors.ring
                        )}
                    >
                        {status}
                    </span>
                </div>
                <div className="text-[10px] text-black/40 dark:text-white/40">
                    {lead.jobTitle || 'No title'}
                </div>
            </div>

            {/* Contact Details */}
            <div className="flex items-center gap-3">
                {lead.email && (
                    <div className="flex items-center gap-1">
                        <Mail className="size-3 text-black/30 dark:text-white/30" />
                        <span className="max-w-[150px] truncate text-[10px] text-black/60 dark:text-white/60">
                            {lead.email}
                        </span>
                        <CopyButton text={lead.email} label="email" />
                    </div>
                )}
                {lead.phone ? (
                    <div className="flex items-center gap-1">
                        <Phone className="size-3 text-black/30 dark:text-white/30" />
                        <span className="text-[10px] text-black/60 dark:text-white/60">
                            {lead.phone}
                        </span>
                        <CopyButton text={lead.phone} label="phone" />
                    </div>
                ) : isFetchingPhone ? (
                    <div className="flex items-center gap-1.5">
                        <Loader2 className="size-3 animate-spin text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            Fetching phone...
                        </span>
                    </div>
                ) : phonePending ? (
                    <button
                        onClick={handleFetchPhone}
                        className="flex items-center gap-1.5 text-[10px] text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                        title="Click to retry phone lookup"
                    >
                        <Phone className="size-3" />
                        <span>Pending - Click to retry</span>
                    </button>
                ) : hasApolloId ? (
                    <button
                        onClick={handleFetchPhone}
                        className="flex items-center gap-1 rounded-md border border-black/10 px-2 py-1 text-[10px] font-medium text-black/50 transition-colors hover:border-black/20 hover:bg-black/5 hover:text-black/70 dark:border-white/10 dark:text-white/50 dark:hover:border-white/20 dark:hover:bg-white/5 dark:hover:text-white/70"
                        title="Fetch phone number (uses 1 credit)"
                    >
                        <PhoneCall className="size-3" />
                        <span>Get Phone</span>
                    </button>
                ) : null}
                {lead.linkedinUrl && (
                    <a
                        href={lead.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded p-1 text-black/30 transition-colors hover:bg-black/5 hover:text-blue-600 dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-blue-400"
                        title="View LinkedIn"
                    >
                        <Linkedin className="size-3" />
                    </a>
                )}
            </div>

            {/* Status Dropdown */}
            {onStatusChange && (
                <select
                    value={status}
                    onChange={(e) => onStatusChange(lead.id, e.target.value)}
                    className="h-6 rounded border border-black/10 bg-transparent px-1.5 text-[10px] text-black/60 focus:border-black/20 focus:outline-none dark:border-white/10 dark:text-white/60"
                >
                    <option value="new" className="bg-white dark:bg-[#0a0a0f]">New</option>
                    <option value="contacted" className="bg-white dark:bg-[#0a0a0f]">Contacted</option>
                    <option value="qualified" className="bg-white dark:bg-[#0a0a0f]">Qualified</option>
                    <option value="rejected" className="bg-white dark:bg-[#0a0a0f]">Rejected</option>
                </select>
            )}
        </div>
    )
}

export function ContactsList({ leads, maxVisible = 3, onStatusChange, onLeadUpdate }: ContactsListProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const visibleLeads = isExpanded ? leads : leads.slice(0, maxVisible)
    const hasMore = leads.length > maxVisible

    if (leads.length === 0) {
        return (
            <div className="py-2 text-center text-xs text-black/40 dark:text-white/40">
                No contacts found
            </div>
        )
    }

    return (
        <div className="space-y-1">
            {visibleLeads.map((lead) => (
                <ContactRow key={lead.id} lead={lead} onStatusChange={onStatusChange} onLeadUpdate={onLeadUpdate} />
            ))}

            {hasMore && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-medium text-black/40 transition-colors hover:bg-black/[0.02] hover:text-black/60 dark:text-white/40 dark:hover:bg-white/[0.02] dark:hover:text-white/60"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="size-3" />
                            Show less
                        </>
                    ) : (
                        <>
                            <ChevronDown className="size-3" />
                            Show all {leads.length} contacts
                        </>
                    )}
                </button>
            )}
        </div>
    )
}
