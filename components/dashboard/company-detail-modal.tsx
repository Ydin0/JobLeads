'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Mail,
    MapPin,
    Briefcase,
    Users,
    Sparkles,
    ExternalLink,
    Globe,
    Copy,
    Check,
    Linkedin,
    Clock,
    CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Job {
    id: string
    title: string
    location: string
    postedDate: string
    url: string
}

interface Lead {
    id: string
    name: string
    title: string
    email: string
    linkedin: string
}

interface Company {
    id: string
    name: string
    logo: string
    website: string
    industry: string
    size: string
    locations: string[]
    jobs: Job[]
    leads: Lead[]
    enriched: boolean
    sources: string[]
    firstSeen: string
}

interface CompanyDetailModalProps {
    company: Company | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CompanyDetailModal({ company, open, onOpenChange }: CompanyDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'jobs' | 'contacts'>('jobs')
    const [copiedField, setCopiedField] = useState<string | null>(null)

    if (!open || !company) return null

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

    const daysSincePosted = (dateString: string) => {
        const posted = new Date(dateString)
        const now = new Date()
        const diff = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))
        if (diff === 0) return 'Today'
        if (diff === 1) return '1d ago'
        return `${diff}d ago`
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex h-[600px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl shadow-purple-500/5 backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex shrink-0 items-start justify-between border-b border-white/5 p-4">
                    <div className="flex items-start gap-3">
                        <div className="flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-lg font-bold text-white ring-1 ring-inset ring-white/10">
                            {company.logo}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-semibold text-white">{company.name}</h2>
                                {company.enriched && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                        <CheckCircle2 className="size-2.5" />
                                        Enriched
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-white/40">{company.industry}</p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-white/30">
                                <span className="flex items-center gap-1">
                                    <Globe className="size-3" />
                                    {company.website}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="size-3" />
                                    {company.size}
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

                {/* Stats row */}
                <div className="relative grid shrink-0 grid-cols-3 gap-3 border-b border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{company.jobs.length}</div>
                        <div className="text-[10px] text-white/40">Open Positions</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-white">{company.locations.length}</div>
                        <div className="text-[10px] text-white/40">Locations</div>
                    </div>
                    <div className="text-center">
                        <div className={cn(
                            "text-xl font-bold",
                            company.enriched ? "text-purple-400" : "text-white/20"
                        )}>
                            {company.leads.length}
                        </div>
                        <div className="text-[10px] text-white/40">Contacts</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="relative flex shrink-0 gap-1 border-b border-white/5 px-4">
                    <button
                        onClick={() => setActiveTab('jobs')}
                        className={cn(
                            'relative px-3 py-2.5 text-xs font-medium transition-colors',
                            activeTab === 'jobs'
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/60'
                        )}>
                        <span className="flex items-center gap-1.5">
                            <Briefcase className="size-3.5" />
                            Jobs ({company.jobs.length})
                        </span>
                        {activeTab === 'jobs' && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('contacts')}
                        className={cn(
                            'relative px-3 py-2.5 text-xs font-medium transition-colors',
                            activeTab === 'contacts'
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/60'
                        )}>
                        <span className="flex items-center gap-1.5">
                            <Users className="size-3.5" />
                            Contacts ({company.leads.length})
                            {!company.enriched && (
                                <span className="rounded bg-purple-500/20 px-1 py-0.5 text-[9px] text-purple-400">
                                    Enrich
                                </span>
                            )}
                        </span>
                        {activeTab === 'contacts' && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4">
                    {activeTab === 'jobs' && (
                        <div className="space-y-2">
                            {company.jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="group flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-inset ring-white/10">
                                            <Briefcase className="size-3.5 text-white/60" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white">{job.title}</h4>
                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-white/30">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="size-2.5" />
                                                    {job.location}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="size-2.5" />
                                                    {daysSincePosted(job.postedDate)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={job.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                        <ExternalLink className="size-3.5" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <>
                            {company.enriched ? (
                                <div className="space-y-2">
                                    {company.leads.map((lead) => (
                                        <div
                                            key={lead.id}
                                            className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-[10px] font-medium text-white ring-1 ring-inset ring-white/10">
                                                    {lead.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium text-white">{lead.name}</h4>
                                                    <p className="text-xs text-white/40">{lead.title}</p>
                                                </div>
                                            </div>

                                            <div className="mt-2.5 space-y-1.5">
                                                <div className="flex items-center justify-between rounded-md bg-white/[0.03] px-2.5 py-1.5">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Mail className="size-3 text-white/30" />
                                                        <span className="text-white/70">{lead.email}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => copyToClipboard(lead.email, `email-${lead.id}`)}
                                                        className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                        {copiedField === `email-${lead.id}` ? (
                                                            <Check className="size-3 text-green-400" />
                                                        ) : (
                                                            <Copy className="size-3" />
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between rounded-md bg-white/[0.03] px-2.5 py-1.5">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Linkedin className="size-3 text-blue-400" />
                                                        <span className="text-white/70">{lead.linkedin}</span>
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
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-inset ring-purple-500/20">
                                        <Sparkles className="size-5 text-purple-400" />
                                    </div>
                                    <h3 className="mt-3 text-sm font-medium text-white">Enrich to find contacts</h3>
                                    <p className="mt-1 max-w-xs text-xs text-white/40">
                                        Find key hiring contacts at {company.name} including emails and LinkedIn profiles.
                                    </p>
                                    <Button className="mt-4 h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                        <Sparkles className="mr-1.5 size-3" />
                                        Enrich (15 credits)
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-white/30">
                        <span>Added {formatDate(company.firstSeen)}</span>
                        <span className="text-white/20">·</span>
                        <span className="truncate max-w-[200px]">{company.sources[0]}</span>
                        {company.sources.length > 1 && (
                            <span className="text-white/20">+{company.sources.length - 1}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="h-7 px-2 text-xs text-white/40 hover:bg-white/10 hover:text-white">
                            Close
                        </Button>
                        {company.enriched ? (
                            <Button size="sm" className="h-7 bg-white px-3 text-xs text-black hover:bg-white/90">
                                <Mail className="mr-1.5 size-3" />
                                Export
                            </Button>
                        ) : (
                            <Button size="sm" className="h-7 bg-gradient-to-r from-purple-500 to-blue-500 px-3 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                <Sparkles className="mr-1.5 size-3" />
                                Enrich
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
