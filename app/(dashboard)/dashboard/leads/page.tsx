'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Download,
    Mail,
    ChevronLeft,
    ChevronRight,
    Check,
    Clock,
    UserCheck,
    UserX,
    Linkedin,
    Users,
    Copy,
    Loader2,
    Building2,
    Phone,
    Sparkles,
    Filter,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLeads } from '@/hooks/use-leads'
import Link from 'next/link'
import type { Lead, Company } from '@/lib/db/schema'
import { EnrichLeadsModal, LeadEnrichmentOptions } from '@/components/dashboard/enrich-leads-modal'

interface LeadWithCompany extends Lead {
    company?: Company | null
}

const statusConfig = {
    new: { label: 'New', icon: Clock, color: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
    contacted: { label: 'Contacted', icon: Mail, color: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20' },
    qualified: { label: 'Qualified', icon: UserCheck, color: 'bg-green-500/10 text-green-400 ring-green-500/20' },
    rejected: { label: 'Rejected', icon: UserX, color: 'bg-red-500/10 text-red-400 ring-red-500/20' },
}

interface AdvancedFilters {
    country: string
    company: string
    hasPhone: 'all' | 'yes' | 'no'
    hasEmail: 'all' | 'yes' | 'no'
}

const defaultFilters: AdvancedFilters = {
    country: '',
    company: '',
    hasPhone: 'all',
    hasEmail: 'all',
}

export default function LeadsPage() {
    const { leads, isLoading, updateLead, bulkEnrichLeads } = useLeads()
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'qualified' | 'rejected'>('all')
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set())
    const [isEnriching, setIsEnriching] = useState(false)
    const [enrichModalOpen, setEnrichModalOpen] = useState(false)
    const [enrichModalLead, setEnrichModalLead] = useState<LeadWithCompany | null>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultFilters)
    const leadsPerPage = 10

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, advancedFilters])

    // Get unique countries and companies for filter dropdowns
    const filterOptions = useMemo(() => {
        const countries = new Set<string>()
        const companies = new Set<string>()

        ;(leads as LeadWithCompany[]).forEach(lead => {
            if (lead.location) {
                // Extract country from location (usually last part after comma)
                const parts = lead.location.split(',').map(p => p.trim())
                const country = parts[parts.length - 1]
                if (country) countries.add(country)
            }
            if (lead.company?.name) {
                companies.add(lead.company.name)
            }
        })

        return {
            countries: Array.from(countries).sort(),
            companies: Array.from(companies).sort(),
        }
    }, [leads])

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (advancedFilters.country) count++
        if (advancedFilters.company) count++
        if (advancedFilters.hasPhone !== 'all') count++
        if (advancedFilters.hasEmail !== 'all') count++
        return count
    }, [advancedFilters])

    // Get selected leads data for modal
    const selectedLeadsData = (leads as LeadWithCompany[]).filter(l => selectedLeads.includes(l.id))

    const openEnrichModal = (lead?: LeadWithCompany) => {
        setEnrichModalLead(lead || null)
        setEnrichModalOpen(true)
    }

    const handleEnrichWithOptions = async (options: LeadEnrichmentOptions) => {
        const leadIdsToEnrich = enrichModalLead ? [enrichModalLead.id] : selectedLeads

        if (leadIdsToEnrich.length === 0) return

        setIsEnriching(true)
        setEnrichingIds(prev => {
            const next = new Set(prev)
            leadIdsToEnrich.forEach(id => next.add(id))
            return next
        })

        try {
            await bulkEnrichLeads(leadIdsToEnrich, options.revealPhoneNumber)
            // Clear selection after successful enrichment
            if (!enrichModalLead) {
                setSelectedLeads([])
            }
        } catch (error) {
            console.error('Error enriching leads:', error)
        } finally {
            setIsEnriching(false)
            setEnrichingIds(prev => {
                const next = new Set(prev)
                leadIdsToEnrich.forEach(id => next.delete(id))
                return next
            })
            setEnrichModalLead(null)
        }
    }

    const stats = [
        { label: 'Total Leads', value: leads.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
        { label: 'New', value: leads.filter(l => l.status === 'new').length, icon: Clock, color: 'from-purple-500 to-pink-500' },
        { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, icon: Mail, color: 'from-yellow-500 to-orange-500' },
        { label: 'Qualified', value: leads.filter(l => l.status === 'qualified').length, icon: UserCheck, color: 'from-green-500 to-emerald-500' },
    ]

    const filteredLeads = useMemo(() => {
        return (leads as LeadWithCompany[]).filter(lead => {
            const companyName = lead.company?.name || ''

            // Basic search
            const matchesSearch = !searchQuery ||
                `${lead.firstName} ${lead.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (lead.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                (lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                companyName.toLowerCase().includes(searchQuery.toLowerCase())

            // Status filter
            const matchesStatus = statusFilter === 'all' || lead.status === statusFilter

            // Advanced filters
            const matchesCountry = !advancedFilters.country ||
                (lead.location?.toLowerCase().includes(advancedFilters.country.toLowerCase()) ?? false)

            const matchesCompany = !advancedFilters.company ||
                companyName.toLowerCase() === advancedFilters.company.toLowerCase()

            const matchesHasPhone =
                advancedFilters.hasPhone === 'all' ||
                (advancedFilters.hasPhone === 'yes' && !!lead.phone) ||
                (advancedFilters.hasPhone === 'no' && !lead.phone)

            const matchesHasEmail =
                advancedFilters.hasEmail === 'all' ||
                (advancedFilters.hasEmail === 'yes' && !!lead.email) ||
                (advancedFilters.hasEmail === 'no' && !lead.email)

            return matchesSearch && matchesStatus && matchesCountry && matchesCompany && matchesHasPhone && matchesHasEmail
        })
    }, [leads, searchQuery, statusFilter, advancedFilters])

    const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)
    const paginatedLeads = filteredLeads.slice(
        (currentPage - 1) * leadsPerPage,
        currentPage * leadsPerPage
    )

    const toggleSelectLead = (id: string) => {
        setSelectedLeads(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedLeads.length === paginatedLeads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(paginatedLeads.map(l => l.id))
        }
    }

    const copyEmail = (email: string) => {
        navigator.clipboard.writeText(email)
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateLead(id, { status: newStatus as 'new' | 'contacted' | 'qualified' | 'rejected' })
        } catch (error) {
            console.error('Error updating lead status:', error)
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-black dark:text-white">Leads</h1>
                    <p className="text-sm text-black/40 dark:text-white/40">
                        Contacts found from enriched companies
                    </p>
                </div>
                {selectedLeads.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => openEnrichModal()}
                            disabled={isEnriching}
                            className="h-8 bg-gradient-to-r from-purple-500 to-blue-500 text-sm text-white hover:from-purple-600 hover:to-blue-600">
                            {isEnriching ? (
                                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="mr-1.5 size-3.5" />
                            )}
                            Enrich {selectedLeads.length} leads
                        </Button>
                        <Button
                            className="h-8 bg-black text-sm text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90">
                            <Download className="mr-1.5 size-3.5" />
                            Export
                        </Button>
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] p-3 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02]">
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div className={cn(
                                'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                stat.color
                            )}>
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold text-black dark:text-white">{stat.value}</div>
                                <div className="text-sm text-black/40 dark:text-white/40">{stat.label}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-black/30 dark:text-white/30" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search leads..."
                            className="h-8 w-full rounded-lg border border-black/10 bg-black/5 pl-9 pr-3 text-sm text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 dark:focus:ring-white/10"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'new', label: 'New' },
                            { id: 'contacted', label: 'Contacted' },
                            { id: 'qualified', label: 'Qualified' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id as typeof statusFilter)}
                                className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                    statusFilter === filter.id
                                        ? 'bg-black/10 text-black dark:bg-white/10 dark:text-white'
                                        : 'text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/60'
                                )}>
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                            showFilters || activeFilterCount > 0
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/60'
                        )}>
                        <Filter className="size-3" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="flex size-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-black dark:text-white">Advanced Filters</h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={() => setAdvancedFilters(defaultFilters)}
                                className="text-xs text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60 flex items-center gap-1">
                                <X className="size-3" />
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Country</label>
                            <select
                                value={advancedFilters.country}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, country: e.target.value }))}
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10">
                                <option value="" className="bg-white dark:bg-[#0a0a0f]">All countries</option>
                                {filterOptions.countries.map(country => (
                                    <option key={country} value={country} className="bg-white dark:bg-[#0a0a0f]">{country}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Company</label>
                            <select
                                value={advancedFilters.company}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, company: e.target.value }))}
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10">
                                <option value="" className="bg-white dark:bg-[#0a0a0f]">All companies</option>
                                {filterOptions.companies.map(company => (
                                    <option key={company} value={company} className="bg-white dark:bg-[#0a0a0f]">{company}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Has Phone</label>
                            <select
                                value={advancedFilters.hasPhone}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasPhone: e.target.value as 'all' | 'yes' | 'no' }))}
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10">
                                <option value="all" className="bg-white dark:bg-[#0a0a0f]">All</option>
                                <option value="yes" className="bg-white dark:bg-[#0a0a0f]">With phone</option>
                                <option value="no" className="bg-white dark:bg-[#0a0a0f]">Without phone</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-black/40 dark:text-white/40 mb-1.5">Has Email</label>
                            <select
                                value={advancedFilters.hasEmail}
                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, hasEmail: e.target.value as 'all' | 'yes' | 'no' }))}
                                className="h-8 w-full rounded-lg border border-black/10 bg-black/5 px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10">
                                <option value="all" className="bg-white dark:bg-[#0a0a0f]">All</option>
                                <option value="yes" className="bg-white dark:bg-[#0a0a0f]">With email</option>
                                <option value="no" className="bg-white dark:bg-[#0a0a0f]">Without email</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
                </div>
            )}

            {/* Leads Table */}
            {!isLoading && paginatedLeads.length > 0 && (
                <div className="relative overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <thead>
                                <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                                    <th className="w-10 px-3 py-2.5 text-left">
                                        <button
                                            onClick={toggleSelectAll}
                                            className={cn(
                                                'flex size-4 items-center justify-center rounded border transition-all',
                                                selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0
                                                    ? 'border-purple-500 bg-purple-500'
                                                    : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                                            )}>
                                            {selectedLeads.length === paginatedLeads.length && paginatedLeads.length > 0 && (
                                                <Check className="size-2.5 text-white" />
                                            )}
                                        </button>
                                    </th>
                                    <th className="w-[180px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Contact</th>
                                    <th className="w-[140px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Company</th>
                                    <th className="w-[140px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Title</th>
                                    <th className="w-[180px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Email</th>
                                    <th className="w-[130px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Phone</th>
                                    <th className="w-[100px] px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">Status</th>
                                    <th className="w-[130px] px-3 py-2.5 text-right text-xs font-medium text-black/40 dark:text-white/40">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                {paginatedLeads.map((lead) => {
                                    const status = statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.new

                                    return (
                                        <tr
                                            key={lead.id}
                                            className={cn(
                                                'group transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
                                                selectedLeads.includes(lead.id) && 'bg-purple-500/5'
                                            )}>
                                            <td className="px-3 py-2.5">
                                                <button
                                                    onClick={() => toggleSelectLead(lead.id)}
                                                    className={cn(
                                                        'flex size-4 items-center justify-center rounded border transition-all',
                                                        selectedLeads.includes(lead.id)
                                                            ? 'border-purple-500 bg-purple-500'
                                                            : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                                                    )}>
                                                    {selectedLeads.includes(lead.id) && (
                                                        <Check className="size-2.5 text-white" />
                                                    )}
                                                </button>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-bold text-white">
                                                        {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0 overflow-hidden">
                                                        <div className="truncate text-sm font-medium text-black dark:text-white">
                                                            {lead.firstName} {lead.lastName}
                                                        </div>
                                                        <div className="truncate text-xs text-black/30 dark:text-white/30">{lead.location || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                {lead.company ? (
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {lead.company.logoUrl ? (
                                                            <img
                                                                src={lead.company.logoUrl}
                                                                alt={lead.company.name}
                                                                className="size-5 shrink-0 rounded object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex size-5 shrink-0 items-center justify-center rounded bg-black/10 text-[10px] font-medium text-black dark:bg-white/10 dark:text-white">
                                                                {lead.company.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="truncate text-xs text-black/60 dark:text-white/60">{lead.company.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-black/30 dark:text-white/30">—</span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <span className="block truncate text-xs text-black/60 dark:text-white/60">{lead.jobTitle || '—'}</span>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                {lead.email ? (
                                                    <div className="flex items-center gap-1 overflow-hidden">
                                                        <span className="truncate text-xs text-black/60 dark:text-white/60">{lead.email}</span>
                                                        <button
                                                            onClick={() => copyEmail(lead.email!)}
                                                            className="shrink-0 rounded p-0.5 text-black/20 transition-colors hover:bg-black/10 hover:text-black dark:text-white/20 dark:hover:bg-white/10 dark:hover:text-white">
                                                            <Copy className="size-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-black/30 dark:text-white/30">—</span>
                                                )}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                {(() => {
                                                    const metadata = lead.metadata as Record<string, unknown> | null
                                                    const phonePending = metadata?.phonePending === true
                                                    const phoneRevealed = metadata?.phoneRevealed === true
                                                    const phoneFound = metadata?.phoneFound === true

                                                    if (lead.phone) {
                                                        return (
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-black/60 dark:text-white/60">{lead.phone}</span>
                                                                <button
                                                                    onClick={() => navigator.clipboard.writeText(lead.phone!)}
                                                                    className="rounded p-0.5 text-black/20 transition-colors hover:bg-black/10 hover:text-black dark:text-white/20 dark:hover:bg-white/10 dark:hover:text-white">
                                                                    <Copy className="size-3" />
                                                                </button>
                                                            </div>
                                                        )
                                                    }

                                                    if (phonePending) {
                                                        return (
                                                            <div className="flex items-center gap-1.5">
                                                                <Loader2 className="size-3 animate-spin text-purple-400" />
                                                                <span className="text-xs text-purple-400">Fetching...</span>
                                                            </div>
                                                        )
                                                    }

                                                    if (phoneRevealed && !phoneFound) {
                                                        return (
                                                            <span className="text-xs text-black/40 dark:text-white/40">No number</span>
                                                        )
                                                    }

                                                    return <span className="text-xs text-black/30 dark:text-white/30">—</span>
                                                })()}
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <select
                                                    value={lead.status}
                                                    onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset cursor-pointer bg-transparent',
                                                        status.color
                                                    )}>
                                                    <option value="new" className="bg-white dark:bg-[#0a0a0f]">New</option>
                                                    <option value="contacted" className="bg-white dark:bg-[#0a0a0f]">Contacted</option>
                                                    <option value="qualified" className="bg-white dark:bg-[#0a0a0f]">Qualified</option>
                                                    <option value="rejected" className="bg-white dark:bg-[#0a0a0f]">Rejected</option>
                                                </select>
                                            </td>

                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    {lead.linkedinUrl && (
                                                        <a
                                                            href={lead.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                            <Linkedin className="size-3.5" />
                                                        </a>
                                                    )}
                                                    {lead.email && (
                                                        <a
                                                            href={`mailto:${lead.email}`}
                                                            className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                            <Mail className="size-3.5" />
                                                        </a>
                                                    )}
                                                    {lead.phone && (
                                                        <a
                                                            href={`tel:${lead.phone}`}
                                                            className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white">
                                                            <Phone className="size-3.5" />
                                                        </a>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openEnrichModal(lead)}
                                                        disabled={enrichingIds.has(lead.id)}
                                                        className="h-6 bg-gradient-to-r from-purple-500 to-blue-500 px-2 text-[10px] text-white hover:from-purple-600 hover:to-blue-600">
                                                        {enrichingIds.has(lead.id) ? (
                                                            <Loader2 className="size-3 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Sparkles className="mr-1 size-2.5" />
                                                                Enrich
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-black/5 bg-black/[0.01] px-4 py-2 dark:border-white/5 dark:bg-white/[0.01]">
                            <div className="text-xs text-black/40 dark:text-white/40">
                                Showing {((currentPage - 1) * leadsPerPage) + 1} to {Math.min(currentPage * leadsPerPage, filteredLeads.length)} of {filteredLeads.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-7 w-7 p-0 text-black/40 hover:bg-black/10 hover:text-black disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="px-2 text-xs text-black/60 dark:text-white/60">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-7 w-7 p-0 text-black/40 hover:bg-black/10 hover:text-black disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white">
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredLeads.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] py-12 text-center dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
                    <div className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <Users className="size-4 text-black/30 dark:text-white/30" />
                    </div>
                    <h3 className="mt-3 text-sm font-medium text-black dark:text-white">No leads yet</h3>
                    <p className="mt-1 max-w-sm text-xs text-black/40 dark:text-white/40">
                        {leads.length === 0
                            ? 'Enrich companies to find contact leads'
                            : 'Try adjusting your search or filter criteria'}
                    </p>
                    {leads.length === 0 && (
                        <Link href="/dashboard/companies">
                            <Button className="mt-4 h-8 !border-0 !ring-0 bg-gradient-to-r from-orange-500 to-red-500 px-3 text-sm text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-600 dark:from-purple-500 dark:to-blue-500 dark:shadow-purple-500/25 dark:hover:from-purple-600 dark:hover:to-blue-600">
                                <Building2 className="mr-1.5 size-3.5" />
                                Go to Companies
                            </Button>
                        </Link>
                    )}
                </div>
            )}

            {/* Enrich Leads Modal */}
            <EnrichLeadsModal
                lead={enrichModalLead}
                leads={enrichModalLead ? undefined : selectedLeadsData}
                open={enrichModalOpen}
                onOpenChange={setEnrichModalOpen}
                onEnrich={handleEnrichWithOptions}
            />
        </div>
    )
}
