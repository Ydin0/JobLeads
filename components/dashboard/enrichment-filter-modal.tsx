'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    X,
    Sparkles,
    Filter,
    Users,
    Briefcase,
    ChevronDown,
    Check,
    Database,
    Zap,
    Save,
    Loader2,
    Calculator,
    AlertTriangle,
    ArrowLeft,
    Building2,
    Phone,
} from 'lucide-react'
import type { FilteredPreviewResponse, FilteredCompanyPreview } from '@/hooks/use-leads-enrichment'

// Common job titles for quick selection
const COMMON_TITLES = {
    'Sales': ['Sales Director', 'VP Sales', 'Head of Sales', 'Sales Manager', 'Account Executive'],
    'Marketing': ['CMO', 'VP Marketing', 'Marketing Director', 'Head of Marketing', 'Marketing Manager'],
    'Engineering': ['CTO', 'VP Engineering', 'Engineering Director', 'Engineering Manager', 'Tech Lead'],
    'Finance': ['CFO', 'VP Finance', 'Finance Director', 'Controller', 'Finance Manager'],
    'Operations': ['COO', 'VP Operations', 'Operations Director', 'Operations Manager'],
    'HR': ['CHRO', 'VP HR', 'HR Director', 'Head of People', 'HR Manager'],
    'Product': ['CPO', 'VP Product', 'Product Director', 'Head of Product', 'Product Manager'],
}

const SENIORITY_OPTIONS = [
    { id: 'c_suite', label: 'C-Suite', description: 'CEO, CTO, CFO, etc.' },
    { id: 'vp', label: 'VP', description: 'Vice President level' },
    { id: 'director', label: 'Director', description: 'Director level' },
    { id: 'manager', label: 'Manager', description: 'Manager level' },
    { id: 'senior', label: 'Senior', description: 'Senior individual contributors' },
    { id: 'entry', label: 'Entry', description: 'Entry level & interns' },
]

type ModalStep = 'filters' | 'preview'

interface EnrichmentFilterModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onEnrich: (params: { titles: string[]; seniorities: string[]; fetchAll?: boolean; revealPhoneNumbers?: boolean }, saveToIcp?: boolean) => void
    onCalculatePreview?: (params: { titles: string[]; seniorities: string[]; fetchAll?: boolean }) => Promise<void>
    // Company info for single enrichment
    company?: {
        id: string
        name: string
        domain?: string | null
    } | null
    // ICP info for bulk enrichment
    icp?: {
        id: string
        name: string
        companiesCount: number
    } | null
    // Cache preview data (basic info before filter calculation)
    cachePreview?: {
        companiesChecked?: number
        companiesInCache: number
        estimatedEmployeesInCache: number
    } | null
    // Filtered preview data (after calculation)
    filteredPreview?: FilteredPreviewResponse | null
    // Saved filters from ICP
    savedFilters?: {
        titles?: string[]
        seniorities?: string[]
    } | null
    // Credits info
    creditsRemaining?: number
    isLoading?: boolean
    isCalculating?: boolean
    isEnriching?: boolean
    showFetchAllOption?: boolean
    mode?: 'single' | 'bulk'
}

export function EnrichmentFilterModal({
    open,
    onOpenChange,
    onEnrich,
    onCalculatePreview,
    company,
    icp,
    cachePreview,
    filteredPreview,
    savedFilters,
    creditsRemaining = 0,
    isLoading = false,
    isCalculating = false,
    isEnriching = false,
    showFetchAllOption = false,
    mode = 'bulk',
}: EnrichmentFilterModalProps) {
    const [step, setStep] = useState<ModalStep>('filters')
    const [selectedTitles, setSelectedTitles] = useState<string[]>([])
    const [customTitle, setCustomTitle] = useState('')
    const [selectedSeniorities, setSelectedSeniorities] = useState<string[]>([])
    const [saveToIcp, setSaveToIcp] = useState(false)
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
    const [fetchAll, setFetchAll] = useState(false)
    const [revealPhoneNumbers, setRevealPhoneNumbers] = useState(false)

    const loading = isLoading || isEnriching || isCalculating

    // Load saved filters when modal opens
    useEffect(() => {
        if (open && savedFilters) {
            if (savedFilters.titles?.length) {
                setSelectedTitles(savedFilters.titles)
            }
            if (savedFilters.seniorities?.length) {
                setSelectedSeniorities(savedFilters.seniorities)
            }
        }
    }, [open, savedFilters])

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setStep('filters')
            setExpandedCategory(null)
            setCustomTitle('')
            setRevealPhoneNumbers(false)
        }
    }, [open])

    // Show preview step when filteredPreview is available
    useEffect(() => {
        if (filteredPreview && !isCalculating) {
            setStep('preview')
        }
    }, [filteredPreview, isCalculating])

    if (!open) return null

    const isBulk = mode === 'bulk' || !!icp
    const entityName = isBulk ? (icp?.name || 'Selected Companies') : company?.name || 'Company'

    const toggleTitle = (title: string) => {
        setSelectedTitles(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        )
    }

    const addCustomTitle = () => {
        if (customTitle.trim() && !selectedTitles.includes(customTitle.trim())) {
            setSelectedTitles(prev => [...prev, customTitle.trim()])
            setCustomTitle('')
        }
    }

    const toggleSeniority = (id: string) => {
        setSelectedSeniorities(prev =>
            prev.includes(id)
                ? prev.filter(s => s !== id)
                : [...prev, id]
        )
    }

    const handleCalculate = async () => {
        if (onCalculatePreview) {
            await onCalculatePreview({
                titles: selectedTitles,
                seniorities: selectedSeniorities,
                fetchAll,
            })
        }
    }

    const handleEnrich = () => {
        onEnrich(
            { titles: selectedTitles, seniorities: selectedSeniorities, fetchAll, revealPhoneNumbers },
            saveToIcp
        )
    }

    const handleBack = () => {
        setStep('filters')
    }

    const hasFilters = selectedTitles.length > 0 || selectedSeniorities.length > 0

    // Get companies with and without matches for display
    const companiesWithMatches = filteredPreview?.companies.filter(c => c.newEmployeesToAdd > 0) || []
    const companiesWithoutMatches = filteredPreview?.companies.filter(c => c.newEmployeesToAdd === 0 && c.hasDomain && !c.error) || []
    const companiesWithErrors = filteredPreview?.companies.filter(c => c.error) || []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => !loading && onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        {step === 'preview' && (
                            <button
                                onClick={handleBack}
                                disabled={loading}
                                className="rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-50 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                            >
                                <ArrowLeft className="size-4" />
                            </button>
                        )}
                        <div className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                            {step === 'filters' ? <Filter className="size-4 text-black dark:text-white" /> : <Calculator className="size-4 text-black dark:text-white" />}
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-black dark:text-white">
                                {step === 'filters'
                                    ? (isBulk ? 'Quick Enrich' : 'Enrich Employees')
                                    : 'Preview Results'
                                }
                            </h2>
                            <p className="text-xs text-black/50 dark:text-white/50">
                                {step === 'filters' ? entityName : `${filteredPreview?.totals.totalNewEmployees || 0} employees found`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => !loading && onOpenChange(false)}
                        disabled={loading}
                        className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-50 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] flex-1 overflow-y-auto p-5 space-y-4">
                    {step === 'filters' ? (
                        <>
                            {/* Cache Status */}
                            {cachePreview && cachePreview.companiesInCache > 0 && (
                                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-500/20 dark:bg-green-500/5">
                                    <Database className="size-4 text-green-600 dark:text-green-400" />
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-green-700 dark:text-green-300">
                                            {cachePreview.companiesInCache} companies already in cache
                                        </div>
                                        <div className="text-[11px] text-green-600/80 dark:text-green-400/70">
                                            ~{cachePreview.estimatedEmployeesInCache} employees available for instant enrichment
                                        </div>
                                    </div>
                                    <Zap className="size-4 text-green-600 dark:text-green-400" />
                                </div>
                            )}

                            {/* Calculating indicator */}
                            {isCalculating && (
                                <div className="flex items-center gap-3 rounded-lg border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
                                    <Loader2 className="size-5 animate-spin text-black/60 dark:text-white/60" />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-black dark:text-white">
                                            Calculating preview...
                                        </div>
                                        <div className="text-xs text-black/50 dark:text-white/50">
                                            Fetching and filtering employees from {isBulk ? 'companies' : company?.name || 'company'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Seniority Selection */}
                            <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                                <div className="mb-3 flex items-center gap-2">
                                    <Users className="size-4 text-black/60 dark:text-white/60" />
                                    <h3 className="text-xs font-medium text-black dark:text-white">Seniority Level</h3>
                                    {selectedSeniorities.length > 0 && (
                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-black">
                                            {selectedSeniorities.length}
                                        </span>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {SENIORITY_OPTIONS.map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() => toggleSeniority(option.id)}
                                            disabled={isCalculating}
                                            className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all disabled:opacity-50 ${
                                                selectedSeniorities.includes(option.id)
                                                    ? 'border-black bg-black/5 dark:border-white dark:bg-white/5'
                                                    : 'border-black/5 hover:border-black/10 hover:bg-black/[0.02] dark:border-white/5 dark:hover:border-white/10 dark:hover:bg-white/[0.02]'
                                            }`}>
                                            <div className={`flex size-4 items-center justify-center rounded border ${
                                                selectedSeniorities.includes(option.id)
                                                    ? 'border-black bg-black dark:border-white dark:bg-white'
                                                    : 'border-black/20 dark:border-white/20'
                                            }`}>
                                                {selectedSeniorities.includes(option.id) && (
                                                    <Check className="size-3 text-white dark:text-black" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-black dark:text-white">{option.label}</div>
                                                <div className="text-[10px] text-black/40 dark:text-white/40">{option.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Job Title Selection */}
                            <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                                <div className="mb-3 flex items-center gap-2">
                                    <Briefcase className="size-4 text-black/60 dark:text-white/60" />
                                    <h3 className="text-xs font-medium text-black dark:text-white">Job Titles</h3>
                                    {selectedTitles.length > 0 && (
                                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-medium text-white dark:bg-white dark:text-black">
                                            {selectedTitles.length}
                                        </span>
                                    )}
                                </div>

                                {/* Selected titles */}
                                {selectedTitles.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {selectedTitles.map((title) => (
                                            <span
                                                key={title}
                                                className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-[11px] font-medium text-black dark:bg-white/10 dark:text-white">
                                                {title}
                                                <button
                                                    onClick={() => toggleTitle(title)}
                                                    disabled={isCalculating}
                                                    className="rounded-full p-0.5 hover:bg-black/10 disabled:opacity-50 dark:hover:bg-white/10">
                                                    <X className="size-2.5" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Custom title input */}
                                <div className="mb-3 flex gap-2">
                                    <input
                                        type="text"
                                        value={customTitle}
                                        onChange={(e) => setCustomTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addCustomTitle()}
                                        placeholder="Add custom title..."
                                        disabled={isCalculating}
                                        className="flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black placeholder:text-black/40 focus:border-black/20 focus:outline-none disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/20"
                                    />
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={addCustomTitle}
                                        disabled={!customTitle.trim() || isCalculating}
                                        className="h-8 px-3 text-xs">
                                        Add
                                    </Button>
                                </div>

                                {/* Quick select by category */}
                                <div className="space-y-1">
                                    {Object.entries(COMMON_TITLES).map(([category, titles]) => (
                                        <div key={category} className="rounded-lg border border-black/5 dark:border-white/5">
                                            <button
                                                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                                                disabled={isCalculating}
                                                className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-black/70 hover:bg-black/[0.02] disabled:opacity-50 dark:text-white/70 dark:hover:bg-white/[0.02]">
                                                {category}
                                                <ChevronDown className={`size-3 transition-transform ${expandedCategory === category ? 'rotate-180' : ''}`} />
                                            </button>
                                            {expandedCategory === category && (
                                                <div className="border-t border-black/5 p-2 dark:border-white/5">
                                                    <div className="flex flex-wrap gap-1">
                                                        {titles.map((title) => (
                                                            <button
                                                                key={title}
                                                                onClick={() => toggleTitle(title)}
                                                                disabled={isCalculating}
                                                                className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors disabled:opacity-50 ${
                                                                    selectedTitles.includes(title)
                                                                        ? 'bg-black text-white dark:bg-white dark:text-black'
                                                                        : 'bg-black/5 text-black/70 hover:bg-black/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10'
                                                                }`}>
                                                                {title}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save to ICP option */}
                            {icp && (
                                <button
                                    onClick={() => setSaveToIcp(!saveToIcp)}
                                    disabled={isCalculating}
                                    className="flex w-full items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/5">
                                    <div className={`flex size-5 items-center justify-center rounded border ${
                                        saveToIcp
                                            ? 'border-black bg-black dark:border-white dark:bg-white'
                                            : 'border-black/20 dark:border-white/20'
                                    }`}>
                                        {saveToIcp && <Check className="size-3 text-white dark:text-black" />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-xs font-medium text-black dark:text-white">Save filters to ICP</div>
                                        <div className="text-[10px] text-black/40 dark:text-white/40">Use these filters as default for this ICP</div>
                                    </div>
                                    <Save className="size-4 text-black/30 dark:text-white/30" />
                                </button>
                            )}

                            {/* Fetch All Option */}
                            {showFetchAllOption && (
                                <button
                                    onClick={() => setFetchAll(!fetchAll)}
                                    disabled={isCalculating}
                                    className="flex w-full items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/5">
                                    <div className={`flex size-5 items-center justify-center rounded border ${
                                        fetchAll
                                            ? 'border-black bg-black dark:border-white dark:bg-white'
                                            : 'border-black/20 dark:border-white/20'
                                    }`}>
                                        {fetchAll && <Check className="size-3 text-white dark:text-black" />}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-xs font-medium text-black dark:text-white">Fetch ALL employees</div>
                                        <div className="text-[10px] text-black/40 dark:text-white/40">
                                            Remove pagination limits (may take longer for large companies)
                                        </div>
                                    </div>
                                    <Users className="size-4 text-black/30 dark:text-white/30" />
                                </button>
                            )}

                            {/* Reveal Phone Numbers Option */}
                            <button
                                onClick={() => setRevealPhoneNumbers(!revealPhoneNumbers)}
                                disabled={isCalculating}
                                className="flex w-full items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/5">
                                <div className={`flex size-5 items-center justify-center rounded border ${
                                    revealPhoneNumbers
                                        ? 'border-black bg-black dark:border-white dark:bg-white'
                                        : 'border-black/20 dark:border-white/20'
                                }`}>
                                    {revealPhoneNumbers && <Check className="size-3 text-white dark:text-black" />}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-xs font-medium text-black dark:text-white">
                                        Reveal phone numbers
                                        <span className="ml-2 rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                            +1 credit/contact
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-black/40 dark:text-white/40">
                                        Fetch mobile/direct phone numbers (takes 3-4 mins via webhook)
                                    </div>
                                </div>
                                <Phone className="size-4 text-black/30 dark:text-white/30" />
                            </button>
                        </>
                    ) : (
                        /* Preview Step */
                        <>
                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 text-center dark:border-white/5 dark:bg-white/[0.02]">
                                    <div className="text-xl font-semibold text-black dark:text-white">
                                        {filteredPreview?.totals.totalNewEmployees || 0}
                                    </div>
                                    <div className="text-[10px] text-black/50 dark:text-white/50">
                                        New Contacts
                                    </div>
                                </div>
                                <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 text-center dark:border-white/5 dark:bg-white/[0.02]">
                                    <div className="text-xl font-semibold text-black dark:text-white">
                                        {filteredPreview?.totals.companiesWithMatches || 0}
                                    </div>
                                    <div className="text-[10px] text-black/50 dark:text-white/50">
                                        Companies
                                    </div>
                                </div>
                                <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 text-center dark:border-white/5 dark:bg-white/[0.02]">
                                    <div className="text-xl font-semibold text-black dark:text-white">
                                        {filteredPreview?.totals.totalCreditsRequired || 0}
                                    </div>
                                    <div className="text-[10px] text-black/50 dark:text-white/50">
                                        Credits Required
                                    </div>
                                </div>
                            </div>

                            {/* Credit Warning */}
                            {filteredPreview && !filteredPreview.hasEnoughCredits && (
                                <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/5">
                                    <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-red-700 dark:text-red-300">
                                            Insufficient credits
                                        </div>
                                        <div className="text-[11px] text-red-600/80 dark:text-red-400/70">
                                            Need {filteredPreview.totals.totalCreditsRequired} credits, have {filteredPreview.creditsRemaining}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Companies with matches */}
                            {companiesWithMatches.length > 0 && (
                                <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Check className="size-4 text-green-600 dark:text-green-400" />
                                        <h3 className="text-xs font-medium text-black dark:text-white">
                                            Companies with matches ({companiesWithMatches.length})
                                        </h3>
                                    </div>
                                    <div className="max-h-40 space-y-1.5 overflow-y-auto">
                                        {companiesWithMatches.map((company) => (
                                            <div
                                                key={company.companyId}
                                                className="flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="size-3 text-black/40 dark:text-white/40" />
                                                    <span className="text-xs text-black dark:text-white">
                                                        {company.companyName}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-black/40 dark:text-white/40">
                                                        {company.matchingEmployees} matching
                                                    </span>
                                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-500/20 dark:text-green-300">
                                                        +{company.newEmployeesToAdd} new
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Companies without matches */}
                            {companiesWithoutMatches.length > 0 && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
                                    <div className="mb-2 flex items-center gap-2">
                                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                                        <h3 className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                            No matches found ({companiesWithoutMatches.length})
                                        </h3>
                                    </div>
                                    <div className="text-[11px] text-amber-600/80 dark:text-amber-400/70 mb-2">
                                        These companies have employees, but none match your filter criteria
                                    </div>
                                    <div className="max-h-32 space-y-1 overflow-y-auto">
                                        {companiesWithoutMatches.slice(0, 5).map((company) => (
                                            <div
                                                key={company.companyId}
                                                className="flex items-center justify-between text-xs"
                                            >
                                                <span className="text-amber-700 dark:text-amber-300">
                                                    {company.companyName}
                                                </span>
                                                <span className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
                                                    {company.totalEmployeesInCache} employees in cache
                                                </span>
                                            </div>
                                        ))}
                                        {companiesWithoutMatches.length > 5 && (
                                            <div className="text-[10px] text-amber-600/70 dark:text-amber-400/60">
                                                ...and {companiesWithoutMatches.length - 5} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Companies with errors */}
                            {companiesWithErrors.length > 0 && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/5">
                                    <div className="mb-2 flex items-center gap-2">
                                        <X className="size-4 text-red-600 dark:text-red-400" />
                                        <h3 className="text-xs font-medium text-red-700 dark:text-red-300">
                                            Errors ({companiesWithErrors.length})
                                        </h3>
                                    </div>
                                    <div className="max-h-24 space-y-1 overflow-y-auto">
                                        {companiesWithErrors.slice(0, 3).map((company) => (
                                            <div
                                                key={company.companyId}
                                                className="flex items-center justify-between text-xs"
                                            >
                                                <span className="text-red-700 dark:text-red-300">
                                                    {company.companyName}
                                                </span>
                                                <span className="text-[10px] text-red-600/70 dark:text-red-400/60">
                                                    {company.error}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* No results at all */}
                            {filteredPreview?.totals.totalNewEmployees === 0 && (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <Users className="size-12 text-black/20 dark:text-white/20 mb-3" />
                                    <h3 className="text-sm font-medium text-black dark:text-white mb-1">
                                        No new contacts found
                                    </h3>
                                    <p className="text-xs text-black/40 dark:text-white/40 max-w-xs">
                                        Try adjusting your filter criteria or selecting different seniority levels
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-black/5 bg-black/[0.02] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
                    {step === 'filters' && (
                        <>
                            {/* Info message */}
                            {!hasFilters && (
                                <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-center dark:bg-amber-500/5">
                                    <span className="text-xs text-amber-700 dark:text-amber-300">
                                        No filters selected - will fetch all available employees
                                    </span>
                                </div>
                            )}

                            {/* Credit info */}
                            <div className="mb-3 flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-3 text-black/40 dark:text-white/40" />
                                    <span className="text-xs text-black/60 dark:text-white/60">Credits remaining</span>
                                </div>
                                <span className="text-xs font-medium text-black dark:text-white">
                                    {creditsRemaining}
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                                    className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCalculate}
                                    disabled={loading}
                                    className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                    {isCalculating ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="mr-2 size-4" />
                                            Calculate Preview
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'preview' && (
                        <>
                            {/* Credit summary */}
                            <div className="mb-3 flex items-center justify-between rounded-lg bg-black/5 px-3 py-2 dark:bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-3 text-black/40 dark:text-white/40" />
                                    <span className="text-xs text-black/60 dark:text-white/60">
                                        {filteredPreview?.totals.totalCreditsRequired || 0} credits required
                                    </span>
                                </div>
                                <span className="text-xs font-medium text-black dark:text-white">
                                    {creditsRemaining} available
                                </span>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    disabled={loading}
                                    className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleEnrich}
                                    disabled={loading || filteredPreview?.totals.totalNewEmployees === 0}
                                    className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90">
                                    {isEnriching ? (
                                        <>
                                            <Loader2 className="mr-2 size-4 animate-spin" />
                                            Enriching...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 size-4" />
                                            Enrich {filteredPreview?.totals.totalNewEmployees || 0} Contacts
                                        </>
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
