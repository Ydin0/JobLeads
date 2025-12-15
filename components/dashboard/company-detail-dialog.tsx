'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Building2,
    MapPin,
    Briefcase,
    Users,
    ExternalLink,
    Linkedin,
    Globe,
    Clock,
    ChevronRight,
    Sparkles,
    Mail,
    Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Company, Job, Lead } from '@/lib/db/schema'

interface CompanyWithRelations extends Company {
    jobs: Job[]
    leads: Lead[]
}

interface CompanyDetailDialogProps {
    companyId: string | null
    onClose: () => void
}

export function CompanyDetailDialog({ companyId, onClose }: CompanyDetailDialogProps) {
    const [company, setCompany] = useState<CompanyWithRelations | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'jobs' | 'leads'>('jobs')

    useEffect(() => {
        if (companyId) {
            setIsLoading(true)
            fetch(`/api/companies/${companyId}`)
                .then(res => res.json())
                .then(data => {
                    setCompany(data)
                    setIsLoading(false)
                })
                .catch(err => {
                    console.error('Error fetching company:', err)
                    setIsLoading(false)
                })
        }
    }, [companyId])

    if (!companyId) return null

    const formatDate = (date: Date | string | null) => {
        if (!date) return 'Unknown'
        const d = new Date(date)
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0f]/95 shadow-2xl backdrop-blur-xl">
                {/* Gradient accents */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="absolute -left-20 -top-20 size-40 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -right-20 -top-20 size-40 rounded-full bg-purple-500/10 blur-3xl" />

                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center">
                        <Loader2 className="size-8 animate-spin text-white/40" />
                    </div>
                ) : company ? (
                    <>
                        {/* Header */}
                        <div className="relative flex shrink-0 items-start justify-between border-b border-white/5 p-4">
                            <div className="flex items-start gap-4">
                                {company.logoUrl ? (
                                    <img
                                        src={company.logoUrl}
                                        alt={company.name}
                                        className="size-14 rounded-xl object-cover"
                                    />
                                ) : (
                                    <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-white/10 to-white/5 text-xl font-bold text-white ring-1 ring-inset ring-white/10">
                                        {company.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{company.name}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/40">
                                        {company.industry && (
                                            <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{company.industry}</span>
                                        )}
                                        {company.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="size-3" />
                                                {company.location}
                                            </span>
                                        )}
                                        {company.size && (
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3" />
                                                {company.size}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center gap-2">
                                        {company.linkedinUrl && (
                                            <a
                                                href={company.linkedinUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-500/20">
                                                <Linkedin className="size-3" />
                                                LinkedIn
                                            </a>
                                        )}
                                        {company.websiteUrl && (
                                            <a
                                                href={company.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10">
                                                <Globe className="size-3" />
                                                Website
                                            </a>
                                        )}
                                        {company.isEnriched ? (
                                            <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-xs text-green-400">
                                                <Sparkles className="size-3" />
                                                Enriched
                                            </span>
                                        ) : (
                                            <Button
                                                size="sm"
                                                className="h-6 bg-gradient-to-r from-purple-500 to-blue-500 px-2 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                                <Sparkles className="mr-1 size-3" />
                                                Enrich
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white">
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="relative grid shrink-0 grid-cols-3 gap-3 border-b border-white/5 p-4">
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{company.jobs?.length || 0}</div>
                                <div className="text-xs text-white/40">Open Positions</div>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{company.leads?.length || 0}</div>
                                <div className="text-xs text-white/40">Contacts Found</div>
                            </div>
                            <div className="rounded-lg bg-white/5 p-3 text-center">
                                <div className="text-2xl font-semibold text-white">{formatDate(company.createdAt)}</div>
                                <div className="text-xs text-white/40">Added</div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="relative flex shrink-0 gap-1 border-b border-white/5 px-4">
                            <button
                                onClick={() => setActiveTab('jobs')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === 'jobs'
                                        ? 'border-white text-white'
                                        : 'border-transparent text-white/40 hover:text-white/60'
                                )}>
                                <Briefcase className="size-4" />
                                Jobs ({company.jobs?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('leads')}
                                className={cn(
                                    'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === 'leads'
                                        ? 'border-white text-white'
                                        : 'border-transparent text-white/40 hover:text-white/60'
                                )}>
                                <Users className="size-4" />
                                Contacts ({company.leads?.length || 0})
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative flex-1 overflow-y-auto p-4">
                            {activeTab === 'jobs' && (
                                <div className="space-y-2">
                                    {company.jobs && company.jobs.length > 0 ? (
                                        company.jobs.map((job) => (
                                            <div
                                                key={job.id}
                                                className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-medium text-white">{job.title}</h4>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/40">
                                                            {job.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="size-3" />
                                                                    {job.location}
                                                                </span>
                                                            )}
                                                            {job.contractType && (
                                                                <span className="rounded bg-white/10 px-1.5 py-0.5">{job.contractType}</span>
                                                            )}
                                                            {job.experienceLevel && (
                                                                <span className="rounded bg-white/10 px-1.5 py-0.5">{job.experienceLevel}</span>
                                                            )}
                                                            {job.salary && (
                                                                <span className="text-green-400">{job.salary}</span>
                                                            )}
                                                        </div>
                                                        {job.postedTime && (
                                                            <div className="mt-1 flex items-center gap-1 text-xs text-white/30">
                                                                <Clock className="size-3" />
                                                                {job.postedTime}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {job.jobUrl && (
                                                        <a
                                                            href={job.jobUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                            <ExternalLink className="size-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-white/5">
                                                <Briefcase className="size-5 text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-white/40">No jobs found</p>
                                            <p className="text-xs text-white/30">Run a search to find open positions</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'leads' && (
                                <div className="space-y-2">
                                    {company.leads && company.leads.length > 0 ? (
                                        company.leads.map((lead) => (
                                            <div
                                                key={lead.id}
                                                className="group rounded-lg border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-sm font-medium text-white ring-1 ring-inset ring-white/10">
                                                        {lead.firstName?.charAt(0)}{lead.lastName?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium text-white">
                                                                {lead.firstName} {lead.lastName}
                                                            </h4>
                                                            <span className={cn(
                                                                'rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                                                lead.status === 'new' && 'bg-green-500/10 text-green-400 ring-green-500/20',
                                                                lead.status === 'contacted' && 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
                                                                lead.status === 'qualified' && 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
                                                                lead.status === 'rejected' && 'bg-red-500/10 text-red-400 ring-red-500/20'
                                                            )}>
                                                                {lead.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-white/40">{lead.jobTitle || 'No title'}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        {lead.email && (
                                                            <a
                                                                href={`mailto:${lead.email}`}
                                                                className="rounded p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                                <Mail className="size-4" />
                                                            </a>
                                                        )}
                                                        {lead.linkedinUrl && (
                                                            <a
                                                                href={lead.linkedinUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded p-1.5 text-blue-400/60 transition-colors hover:bg-blue-500/10 hover:text-blue-400">
                                                                <Linkedin className="size-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-white/5">
                                                <Users className="size-5 text-white/30" />
                                            </div>
                                            <p className="mt-3 text-sm text-white/40">No contacts found</p>
                                            <p className="text-xs text-white/30">Enrich this company to find contacts</p>
                                            <Button
                                                size="sm"
                                                className="mt-3 h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-xs text-white hover:from-purple-600 hover:to-blue-600">
                                                <Sparkles className="mr-1.5 size-3" />
                                                Enrich Company
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-1 items-center justify-center">
                        <p className="text-white/40">Company not found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
