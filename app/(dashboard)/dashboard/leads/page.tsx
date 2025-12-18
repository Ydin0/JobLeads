'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
    Search,
    Download,
    Building2,
    Users,
    TrendingUp,
    Loader2,
    Filter,
    X,
    Check,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCRMLeads, type CompanyWithLeads } from '@/hooks/use-crm-leads'
import { useLeadsEnrichment } from '@/hooks/use-leads-enrichment'
import {
    CompanyLeadCard,
    CompanyDetailPanel,
    CRMExportModal,
} from '@/components/dashboard/crm'
import { EnrichmentFilterModal } from '@/components/dashboard/enrichment-filter-modal'
import Link from 'next/link'

export default function LeadsPage() {
    const {
        companiesWithLeads,
        isLoading,
        filters,
        setFilters,
        stats,
        industries,
        sizes,
        updateLeadStatus,
        generateAIContent,
        isAILoading,
        fetchData,
    } = useCRMLeads()

    const {
        isEnriching,
        isCalculating,
        preview: enrichmentPreview,
        filteredPreview,
        getPreview,
        calculateFilteredPreview,
        enrichCompanies,
        clearPreview,
        clearFilteredPreview,
    } = useLeadsEnrichment()

    const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set())
    const [detailPanelData, setDetailPanelData] = useState<CompanyWithLeads | null>(null)
    const [showExportModal, setShowExportModal] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [showEnrichModal, setShowEnrichModal] = useState(false)
    const [enrichTarget, setEnrichTarget] = useState<{
        type: 'single' | 'bulk'
        companyIds: string[]
        companyName?: string
    } | null>(null)

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.industry !== 'all') count++
        if (filters.status !== 'all') count++
        if (filters.size !== 'all') count++
        return count
    }, [filters])

    const toggleSelectAll = () => {
        if (selectedCompanies.size === companiesWithLeads.length) {
            setSelectedCompanies(new Set())
        } else {
            setSelectedCompanies(new Set(companiesWithLeads.map((c) => c.company.id)))
        }
    }

    const handleStatusChange = async (leadId: string, status: string) => {
        try {
            await updateLeadStatus(leadId, status as 'new' | 'contacted' | 'qualified' | 'rejected')
        } catch (error) {
            console.error('Error updating lead status:', error)
        }
    }

    const clearFilters = () => {
        setFilters({
            search: '',
            industry: 'all',
            status: 'all',
            size: 'all',
        })
    }

    // Open enrichment modal for bulk or single company
    const openEnrichModal = useCallback(async (companyIds: string[], companyName?: string) => {
        setEnrichTarget({
            type: companyIds.length === 1 ? 'single' : 'bulk',
            companyIds,
            companyName,
        })
        await getPreview(companyIds)
        setShowEnrichModal(true)
    }, [getPreview])

    // Handle bulk enrich button click
    const handleBulkEnrich = useCallback(() => {
        const targetIds = selectedCompanies.size > 0
            ? Array.from(selectedCompanies)
            : companiesWithLeads.map((c) => c.company.id)
        openEnrichModal(targetIds)
    }, [selectedCompanies, companiesWithLeads, openEnrichModal])

    // Handle single company enrich
    const handleEnrichCompany = useCallback((companyId: string, companyName: string) => {
        openEnrichModal([companyId], companyName)
    }, [openEnrichModal])

    // Handle calculate preview
    const handleCalculatePreview = useCallback(async (params: {
        titles: string[]
        seniorities: string[]
        fetchAll?: boolean
    }) => {
        if (!enrichTarget) return

        await calculateFilteredPreview({
            companyIds: enrichTarget.companyIds,
            filters: {
                titles: params.titles,
                seniorities: params.seniorities,
            },
            fetchAll: params.fetchAll,
        })
    }, [enrichTarget, calculateFilteredPreview])

    // Handle enrichment execution
    const handleEnrich = useCallback(async (params: {
        titles: string[]
        seniorities: string[]
        fetchAll?: boolean
    }) => {
        if (!enrichTarget) return

        const result = await enrichCompanies({
            companyIds: enrichTarget.companyIds,
            filters: {
                titles: params.titles,
                seniorities: params.seniorities,
            },
            fetchAll: params.fetchAll,
        })

        if (result?.success) {
            setShowEnrichModal(false)
            setEnrichTarget(null)
            clearPreview()
            // Refresh leads data to show new employees
            fetchData?.()
        }
    }, [enrichTarget, enrichCompanies, clearPreview, fetchData])

    const statCards = [
        {
            label: 'Companies',
            value: stats.totalCompanies,
            icon: Building2,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            label: 'Contacts',
            value: stats.totalContacts,
            icon: Users,
            color: 'from-purple-500 to-pink-500',
        },
        {
            label: 'New This Week',
            value: stats.newThisWeek,
            icon: TrendingUp,
            color: 'from-green-500 to-emerald-500',
        },
        {
            label: 'Ready to Export',
            value: stats.readyToExport,
            icon: Download,
            color: 'from-orange-500 to-red-500',
        },
    ]

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-black dark:text-white">
                        CRM Pipeline
                    </h1>
                    <p className="text-sm text-black/40 dark:text-white/40">
                        Companies with qualified leads
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Enrich Employees Button */}
                    <Button
                        onClick={handleBulkEnrich}
                        disabled={isEnriching || companiesWithLeads.length === 0}
                        className="h-8 !border-0 !ring-0 bg-gradient-to-r from-orange-500 to-red-500 px-3 text-sm text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-600 dark:from-purple-500 dark:to-blue-500 dark:shadow-purple-500/25 dark:hover:from-purple-600 dark:hover:to-blue-600"
                    >
                        {isEnriching ? (
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                            <Sparkles className="mr-1.5 size-3.5" />
                        )}
                        Enrich Employees
                        {selectedCompanies.size > 0 && ` (${selectedCompanies.size})`}
                    </Button>
                    {selectedCompanies.size > 0 && (
                        <Button
                            onClick={() => setShowExportModal(true)}
                            className="h-8 bg-black text-sm text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                        >
                            <Download className="mr-1.5 size-3.5" />
                            Export {selectedCompanies.size}
                        </Button>
                    )}
                    <Button
                        onClick={() => setShowExportModal(true)}
                        variant="outline"
                        className="h-8 border-black/10 bg-transparent text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        <Download className="mr-1.5 size-3.5" />
                        Export All
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-xl border border-black/5 bg-white/70 p-3 backdrop-blur-sm dark:border-white/5 dark:bg-white/[0.02]"
                    >
                        <div className="absolute -right-4 -top-4 size-16 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
                        <div className="relative flex items-center gap-3">
                            <div
                                className={cn(
                                    'flex size-8 items-center justify-center rounded-lg bg-gradient-to-br shadow-lg',
                                    stat.color
                                )}
                            >
                                <stat.icon className="size-4 text-white" />
                            </div>
                            <div>
                                <div className="text-2xl font-semibold text-black dark:text-white">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-black/40 dark:text-white/40">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    {/* Search */}
                    <div className="relative max-w-md flex-1">
                        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-black/30 dark:text-white/30" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            placeholder="Search companies or contacts..."
                            className="h-8 w-full rounded-lg border border-black/10 bg-white/50 pl-9 pr-3 text-sm text-black placeholder:text-black/30 focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/20 dark:focus:ring-white/10"
                        />
                    </div>

                    {/* Status filter buttons */}
                    <div className="flex items-center gap-1">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'new', label: 'New' },
                            { id: 'contacted', label: 'Contacted' },
                            { id: 'qualified', label: 'Qualified' },
                        ].map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() =>
                                    setFilters({ ...filters, status: filter.id })
                                }
                                className={cn(
                                    'rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                                    filters.status === filter.id
                                        ? 'bg-black/10 text-black dark:bg-white/10 dark:text-white'
                                        : 'text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/60'
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Advanced filters button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all',
                            showFilters || activeFilterCount > 0
                                ? 'bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] dark:bg-purple-500/20 dark:text-purple-400'
                                : 'text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white/60'
                        )}
                    >
                        <Filter className="size-3" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="flex size-4 items-center justify-center rounded-full bg-[var(--theme-accent)] text-[10px] font-bold text-white dark:bg-purple-500">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Select all */}
                {companiesWithLeads.length > 0 && (
                    <button
                        onClick={toggleSelectAll}
                        className="flex items-center gap-2 text-xs text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
                    >
                        <div
                            className={cn(
                                'flex size-4 items-center justify-center rounded border transition-colors',
                                selectedCompanies.size === companiesWithLeads.length
                                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] dark:border-purple-500 dark:bg-purple-500'
                                    : 'border-black/20 dark:border-white/20'
                            )}
                        >
                            {selectedCompanies.size === companiesWithLeads.length && (
                                <Check className="size-3 text-white" />
                            )}
                        </div>
                        Select all
                    </button>
                )}
            </div>

            {/* Advanced Filters Panel */}
            {showFilters && (
                <div className="rounded-xl border border-black/5 bg-white/50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-black dark:text-white">
                            Advanced Filters
                        </h3>
                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
                            >
                                <X className="size-3" />
                                Clear all
                            </button>
                        )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label className="mb-1.5 block text-xs text-black/40 dark:text-white/40">
                                Industry
                            </label>
                            <select
                                value={filters.industry}
                                onChange={(e) =>
                                    setFilters({ ...filters, industry: e.target.value })
                                }
                                className="h-8 w-full rounded-lg border border-black/10 bg-white px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                            >
                                <option value="all" className="bg-white dark:bg-[#0a0a0f]">
                                    All industries
                                </option>
                                {industries.map((industry) => (
                                    <option
                                        key={industry}
                                        value={industry}
                                        className="bg-white dark:bg-[#0a0a0f]"
                                    >
                                        {industry}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs text-black/40 dark:text-white/40">
                                Company Size
                            </label>
                            <select
                                value={filters.size}
                                onChange={(e) =>
                                    setFilters({ ...filters, size: e.target.value })
                                }
                                className="h-8 w-full rounded-lg border border-black/10 bg-white px-2.5 text-xs text-black focus:border-black/20 focus:outline-none focus:ring-1 focus:ring-black/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-white/20 dark:focus:ring-white/10"
                            >
                                <option value="all" className="bg-white dark:bg-[#0a0a0f]">
                                    All sizes
                                </option>
                                {sizes.map((size) => (
                                    <option
                                        key={size}
                                        value={size}
                                        className="bg-white dark:bg-[#0a0a0f]"
                                    >
                                        {size}
                                    </option>
                                ))}
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

            {/* Company List */}
            {!isLoading && companiesWithLeads.length > 0 && (
                <div className="space-y-3">
                    {companiesWithLeads.map((data) => (
                        <CompanyLeadCard
                            key={data.company.id}
                            data={data}
                            isSelected={selectedCompanies.has(data.company.id)}
                            onSelect={(selected) => {
                                if (selected) {
                                    setSelectedCompanies((prev) => new Set([...prev, data.company.id]))
                                } else {
                                    setSelectedCompanies((prev) => {
                                        const next = new Set(prev)
                                        next.delete(data.company.id)
                                        return next
                                    })
                                }
                            }}
                            onViewDetails={() => setDetailPanelData(data)}
                            onStatusChange={handleStatusChange}
                            onGenerateAI={generateAIContent}
                            isAILoading={isAILoading}
                            onEnrichEmployees={() => handleEnrichCompany(data.company.id, data.company.name)}
                            isEnriching={isEnriching && enrichTarget?.companyIds.includes(data.company.id)}
                        />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && companiesWithLeads.length === 0 && (
                <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-white/50 py-12 text-center dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
                    <div className="flex size-12 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <Building2 className="size-5 text-black/30 dark:text-white/30" />
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-black dark:text-white">
                        No companies with leads yet
                    </h3>
                    <p className="mt-1 max-w-sm text-xs text-black/40 dark:text-white/40">
                        {stats.totalCompanies === 0
                            ? 'Enrich companies to find contact leads, then they will appear here grouped by company.'
                            : 'Try adjusting your search or filter criteria'}
                    </p>
                    {stats.totalCompanies === 0 && (
                        <Link href="/dashboard/companies">
                            <Button className="mt-4 h-8 !border-0 !ring-0 bg-gradient-to-r from-orange-500 to-red-500 px-3 text-sm text-white shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-red-600 dark:from-purple-500 dark:to-blue-500 dark:shadow-purple-500/25 dark:hover:from-purple-600 dark:hover:to-blue-600">
                                <Building2 className="mr-1.5 size-3.5" />
                                Go to Companies
                            </Button>
                        </Link>
                    )}
                </div>
            )}

            {/* Detail Panel */}
            {detailPanelData && (
                <CompanyDetailPanel
                    data={detailPanelData}
                    isOpen={!!detailPanelData}
                    onClose={() => setDetailPanelData(null)}
                    onStatusChange={handleStatusChange}
                    onGenerateAI={generateAIContent}
                    isAILoading={isAILoading}
                />
            )}

            {/* Export Modal */}
            <CRMExportModal
                companies={companiesWithLeads}
                selectedCompanyIds={
                    selectedCompanies.size > 0 ? Array.from(selectedCompanies) : undefined
                }
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            {/* Enrichment Modal */}
            {enrichTarget && (
                <EnrichmentFilterModal
                    open={showEnrichModal}
                    onOpenChange={(open) => {
                        setShowEnrichModal(open)
                        if (!open) {
                            setEnrichTarget(null)
                            clearPreview()
                        }
                    }}
                    onEnrich={handleEnrich}
                    onCalculatePreview={handleCalculatePreview}
                    company={enrichTarget.type === 'single' ? {
                        id: enrichTarget.companyIds[0],
                        name: enrichTarget.companyName || '',
                    } : null}
                    icp={enrichTarget.type === 'bulk' ? {
                        id: 'leads-page',
                        name: enrichTarget.companyName || `${enrichTarget.companyIds.length} Companies`,
                        companiesCount: enrichTarget.companyIds.length,
                    } : undefined}
                    cachePreview={enrichmentPreview ? {
                        companiesChecked: enrichmentPreview.totals.totalCompanies,
                        companiesInCache: enrichmentPreview.totals.companiesInCache,
                        estimatedEmployeesInCache: enrichmentPreview.totals.estimatedEmployeesInCache,
                    } : null}
                    filteredPreview={filteredPreview}
                    creditsRemaining={filteredPreview?.creditsRemaining ?? enrichmentPreview?.creditsRemaining ?? 0}
                    isCalculating={isCalculating}
                    isEnriching={isEnriching}
                    showFetchAllOption={true}
                    mode={enrichTarget.type === 'single' ? 'single' : 'bulk'}
                />
            )}
        </div>
    )
}
