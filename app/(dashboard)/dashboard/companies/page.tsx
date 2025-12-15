'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Building2,
    MapPin,
    Briefcase,
    Users,
    Sparkles,
    Check,
    ExternalLink,
    CheckCircle2,
    Circle,
    Loader2,
    Linkedin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompanies } from '@/hooks/use-companies'
import Link from 'next/link'

interface JobMetadata {
    id: string
    title: string
    url: string
    location: string
    publishedAt: string
}

interface CompanyMetadata {
    linkedinId?: string
    jobCount?: number
    jobs?: JobMetadata[]
}

export default function CompaniesPage() {
    const { companies, isLoading } = useCompanies()
    const [searchQuery, setSearchQuery] = useState('')
    const [enrichmentFilter, setEnrichmentFilter] = useState<'all' | 'enriched' | 'not_enriched'>('all')
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])

    const stats = [
        {
            label: 'Total Companies',
            value: companies.length,
            icon: Building2,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            label: 'Total Jobs',
            value: companies.reduce((acc, c) => {
                const metadata = c.metadata as CompanyMetadata | null
                return acc + (metadata?.jobCount || 0)
            }, 0),
            icon: Briefcase,
            color: 'from-purple-500 to-pink-500',
        },
        {
            label: 'Enriched',
            value: companies.filter(c => c.isEnriched).length,
            icon: CheckCircle2,
            color: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Pending',
            value: companies.filter(c => !c.isEnriched).length,
            icon: Circle,
            color: 'from-orange-500 to-amber-500',
        },
    ]

    const filteredCompanies = companies.filter(company => {
        const matchesSearch =
            company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        const matchesEnrichment =
            enrichmentFilter === 'all' ||
            (enrichmentFilter === 'enriched' && company.isEnriched) ||
            (enrichmentFilter === 'not_enriched' && !company.isEnriched)
        return matchesSearch && matchesEnrichment
    })

    const sortedCompanies = [...filteredCompanies].sort((a, b) => {
        const aJobs = (a.metadata as CompanyMetadata | null)?.jobCount || 0
        const bJobs = (b.metadata as CompanyMetadata | null)?.jobCount || 0
        return bJobs - aJobs
    })

    const toggleSelectCompany = (id: string) => {
        setSelectedCompanies(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedCompanies.length === sortedCompanies.length) {
            setSelectedCompanies([])
        } else {
            setSelectedCompanies(sortedCompanies.map(c => c.id))
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Companies</h1>
                    <p className="text-sm text-white/40">
                        Companies found from your searches. Enrich to find contacts.
                    </p>
                </div>
                {selectedCompanies.length > 0 && (
                    <Button
                        className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-sm text-white hover:from-purple-600 hover:to-blue-600">
                        <Sparkles className="mr-1.5 size-3.5" />
                        Enrich {selectedCompanies.length} {selectedCompanies.length === 1 ? 'Company' : 'Companies'}
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-sm">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold text-white">{stat.value}</div>
                                <div className="text-sm text-white/40">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search companies..."
                            className="h-8 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'not_enriched', label: 'Not Enriched' },
                            { id: 'enriched', label: 'Enriched' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setEnrichmentFilter(filter.id as typeof enrichmentFilter)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                    enrichmentFilter === filter.id
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                                )}>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={toggleSelectAll}
                    className="text-xs text-white/40 hover:text-white">
                    {selectedCompanies.length === sortedCompanies.length && sortedCompanies.length > 0 ? 'Deselect all' : 'Select all'}
                </button>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-white/40" />
                </div>
            )}

            {/* Companies Table */}
            {!isLoading && sortedCompanies.length > 0 && (
                <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-3 py-2.5 text-left">
                                        <button
                                            onClick={toggleSelectAll}
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded border transition-all',
                                                selectedCompanies.length === sortedCompanies.length && sortedCompanies.length > 0
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-white/20 hover:border-white/40'
                                            )}>
                                            {selectedCompanies.length === sortedCompanies.length && sortedCompanies.length > 0 && (
                                                <Check className="size-2.5 text-white" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Company</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Jobs</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Location</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Size</th>
                                    <th className="px-3 py-2.5 text-left text-xs font-medium text-white/40">Status</th>
                                    <th className="px-3 py-2.5 text-right text-xs font-medium text-white/40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sortedCompanies.map((company) => {
                                    const metadata = company.metadata as CompanyMetadata | null
                                    const jobCount = metadata?.jobCount || 0

                                    return (
                                        <tr
                                            key={company.id}
                                            className={cn(
                                                'group transition-colors hover:bg-white/[0.03]',
                                                selectedCompanies.includes(company.id) && 'bg-purple-500/5'
                                            )}>
                                            <td className="px-3 py-2.5">
                                                <button
                                                    onClick={() => toggleSelectCompany(company.id)}
                                                    className={cn(
                                                        'flex size-4 items-center justify-center rounded border transition-all',
                                                        selectedCompanies.includes(company.id)
                                                            ? 'border-purple-500 bg-purple-500'
                                                            : 'border-white/20 hover:border-white/40'
                                                    )}>
                                                    {selectedCompanies.includes(company.id) && (
                                                        <Check className="size-2.5 text-white" />
                                                    )}
                                                </button>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    {company.logoUrl ? (
                                                        <img
                                                            src={company.logoUrl}
                                                            alt={company.name}
                                                            className="size-8 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-white/10 to-white/5 text-xs font-bold text-white ring-1 ring-inset ring-white/10">
                                                            {company.name.charAt(0)}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-white">{company.name}</div>
                                                        <div className="text-xs text-white/30">{company.industry || 'Unknown'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                                                        {jobCount}
                                                    </span>
                                                    <span className="text-[10px] text-white/30">positions</span>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-1 text-xs text-white/60">
                                                    <MapPin className="size-3 text-white/30" />
                                                    <span className="max-w-[120px] truncate">{company.location || 'Unknown'}</span>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <span className="text-xs text-white/60">{company.size || '—'}</span>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                {company.isEnriched ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                                        <CheckCircle2 className="size-2.5" />
                                                        Enriched
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/40 ring-1 ring-inset ring-white/10">
                                                        <Circle className="size-2.5" />
                                                        Pending
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    {company.linkedinUrl && (
                                                        <a
                                                            href={company.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                            <Linkedin className="size-3.5" />
                                                        </a>
                                                    )}
                                                    {company.websiteUrl && (
                                                        <a
                                                            href={company.websiteUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1 text-white/30 transition-colors hover:bg-white/10 hover:text-white">
                                                            <ExternalLink className="size-3.5" />
                                                        </a>
                                                    )}
                                                    {!company.isEnriched ? (
                                                        <Button
                                                            size="sm"
                                                            className="h-7 w-[72px] bg-gradient-to-r from-purple-500 to-blue-500 text-[10px] text-white hover:from-purple-600 hover:to-blue-600">
                                                            <Sparkles className="mr-1 size-2.5" />
                                                            Enrich
                                                        </Button>
                                                    ) : (
                                                        <Link href="/dashboard/leads">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 w-[72px] text-[10px] text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                                                                <Users className="mr-1 size-2.5" />
                                                                Leads
                                                            </Button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && sortedCompanies.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] py-12 text-center">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/5">
                        <Building2 className="size-4 text-white/30" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-white">No companies found</h3>
                    <p className="mt-1 text-xs text-white/40">
                        {companies.length === 0
                            ? 'Run a search to find companies with open positions'
                            : 'Try adjusting your search or filter criteria'}
                    </p>
                    {companies.length === 0 && (
                        <Link href="/dashboard/searches">
                            <Button className="mt-4 h-8 bg-white text-sm text-black hover:bg-white/90">
                                Go to Searches
                            </Button>
                        </Link>
                    )}
                </div>
            )}
        </div>
    )
}
