'use client'

import { Button } from '@/components/ui/button'
import {
    X,
    Mail,
    Phone,
    MapPin,
    Building2,
    Linkedin,
    Globe,
    Briefcase,
    Clock,
    UserCheck,
    UserX,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface Lead {
    id: string
    name: string
    title: string
    company: string
    companyLogo: string
    location: string
    email: string
    phone: string
    linkedin: string
    source: string
    sourceBoard?: string
    status: string
    dateFound: string
    experience: string
    skills: string[]
}

interface LeadDetailModalProps {
    lead: Lead | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

const statusConfig = {
    new: {
        label: 'New',
        color: 'bg-green-500/10 text-green-400 ring-green-500/20',
        icon: Clock,
    },
    contacted: {
        label: 'Contacted',
        color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
        icon: Mail,
    },
    qualified: {
        label: 'Qualified',
        color: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
        icon: UserCheck,
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-red-500/10 text-red-400 ring-red-500/20',
        icon: UserX,
    },
}

const statusOptions = [
    { id: 'new', label: 'New', color: 'bg-green-500' },
    { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
    { id: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
    { id: 'rejected', label: 'Rejected', color: 'bg-red-500' },
]

export function LeadDetailModal({ lead, open, onOpenChange }: LeadDetailModalProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [currentStatus, setCurrentStatus] = useState(lead?.status || 'new')

    if (!open || !lead) return null

    const status = statusConfig[lead.status as keyof typeof statusConfig]

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(field)
        setTimeout(() => setCopiedField(null), 2000)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex h-[550px] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex shrink-0 items-start justify-between border-b border-white/5 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-medium text-white ring-1 ring-inset ring-white/10">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-white">{lead.name}</h2>
                            <p className="text-xs text-white/40">{lead.title}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                                <span className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                    status.color
                                )}>
                                    <status.icon className="size-2.5" />
                                    {status.label}
                                </span>
                                <span className="text-[10px] text-white/30">
                                    Found {formatDate(lead.dateFound)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                        {/* Contact Info */}
                        <div>
                            <h3 className="mb-2 text-xs font-medium text-white/60">Contact</h3>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-3 text-white/30" />
                                        <span className="text-xs text-white/70">{lead.email}</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(lead.email, 'email')}
                                        className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                        {copiedField === 'email' ? (
                                            <Check className="size-3 text-green-400" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
                                    <div className="flex items-center gap-2">
                                        <Phone className="size-3 text-white/30" />
                                        <span className="text-xs text-white/70">{lead.phone}</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(lead.phone, 'phone')}
                                        className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                        {copiedField === 'phone' ? (
                                            <Check className="size-3 text-green-400" />
                                        ) : (
                                            <Copy className="size-3" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2">
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="size-3 text-blue-400" />
                                        <span className="text-xs text-white/70">{lead.linkedin}</span>
                                    </div>
                                    <a
                                        href={`https://${lead.linkedin}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Company & Location */}
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="mb-1.5 flex items-center gap-1.5 text-white/30">
                                    <Building2 className="size-3" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">Company</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex size-6 items-center justify-center rounded bg-white/10 text-[10px] font-medium text-white">
                                        {lead.companyLogo}
                                    </div>
                                    <span className="text-xs font-medium text-white">{lead.company}</span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="mb-1.5 flex items-center gap-1.5 text-white/30">
                                    <MapPin className="size-3" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">Location</span>
                                </div>
                                <span className="text-xs font-medium text-white">{lead.location}</span>
                            </div>
                        </div>

                        {/* Experience & Source */}
                        <div className="grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="mb-1.5 flex items-center gap-1.5 text-white/30">
                                    <Briefcase className="size-3" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">Experience</span>
                                </div>
                                <span className="text-xs font-medium text-white">{lead.experience}</span>
                            </div>

                            <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                                <div className="mb-1.5 flex items-center gap-1.5 text-white/30">
                                    <Globe className="size-3" />
                                    <span className="text-[10px] font-medium uppercase tracking-wider">Source</span>
                                </div>
                                <span className="text-xs text-white/70 truncate block">{lead.source}</span>
                            </div>
                        </div>

                        {/* Skills */}
                        <div>
                            <h3 className="mb-2 text-xs font-medium text-white/60">Skills</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {lead.skills.map((skill) => (
                                    <span
                                        key={skill}
                                        className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/60">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Update Status */}
                        <div>
                            <h3 className="mb-2 text-xs font-medium text-white/60">Status</h3>
                            <div className="flex flex-wrap gap-1.5">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setCurrentStatus(option.id)}
                                        className={cn(
                                            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all',
                                            currentStatus === option.id
                                                ? 'border-white/20 bg-white/10 text-white'
                                                : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'
                                        )}>
                                        <div className={cn('size-1.5 rounded-full', option.color)} />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <h3 className="mb-2 text-xs font-medium text-white/60">Notes</h3>
                            <textarea
                                placeholder="Add notes about this lead..."
                                className="h-16 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                        Close
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-white/10 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10 hover:text-white">
                            <Mail className="mr-1.5 size-3" />
                            Email
                        </Button>
                        <Button size="sm" className="h-7 bg-white px-3 text-xs text-black hover:bg-white/90">
                            Save
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
