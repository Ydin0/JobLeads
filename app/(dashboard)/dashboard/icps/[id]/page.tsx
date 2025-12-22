'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    Target,
    Building2,
    Users,
    Edit2,
    Trash2,
    ExternalLink,
    Sparkles,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Briefcase,
    MapPin,
    UserPlus,
    MoreVertical,
    Download,
    RefreshCw,
    Play,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    GraduationCap,
    Zap,
    Activity,
    Check,
    Loader2,
    AlertCircle,
    Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import { EnrichmentFilterModal } from '@/components/dashboard/enrichment-filter-modal'
import type { FilteredPreviewResponse } from '@/hooks/use-leads-enrichment'
import { useICPLeads, type AIContentType } from '@/hooks/use-icp-leads'
import { CompanyLeadCard } from '@/components/dashboard/crm/company-lead-card'
import { CRMExportModal } from '@/components/dashboard/crm/crm-export-modal'
import { RunScrapersDialog } from '@/components/dashboard/run-scrapers-dialog'
import { AddScraperModal } from '@/components/dashboard/add-scraper-modal'
import { EditICPModal } from '@/components/dashboard/edit-icp-modal'
import { DeleteConfirmationDialog } from '@/components/dashboard/delete-confirmation-dialog'
import { getJobBoardById } from '@/components/icons/job-boards'

// API response types
interface ScraperConfig {
    jobTitle: string
    location: string
    experienceLevel: string
}

interface ScraperRunAPI {
    id: string
    searchId: string
    orgId: string
    scraperIndex: number | null
    scraperConfig: ScraperConfig | null
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'
    jobsFound: number | null
    companiesFound: number | null
    newCompanies: number | null
    leadsCreated: number | null
    duration: number | null
    errorMessage: string | null
    apifyRunId: string | null
    startedAt: string | null
    completedAt: string | null
}

interface SearchFilters {
    jobTitles?: string[]
    departments?: string[]
    techStack?: string[]
    minJobs?: number
    scrapers?: ScraperConfig[]
    jobBoards?: string[]
    maxRows?: number
    enrichmentFilters?: {
        decisionMakerTitles?: string[]
        decisionMakerSeniorities?: string[]
    }
}

interface ICPData {
    id: string
    name: string
    description: string | null
    filters: SearchFilters | null
    status: string
    resultsCount: number | null
    jobsCount: number | null
    lastRunAt: string | null
    createdAt: string
    updatedAt: string
}

interface CompanyData {
    id: string
    name: string
    domain: string | null
    industry: string | null
    size: string | null
    location: string | null
    description: string | null
    logoUrl: string | null
    linkedinUrl: string | null
    websiteUrl: string | null
    isEnriched: boolean | null
    enrichedAt: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
    // Counts from API
    employeesCount?: number
    leadsCount?: number
    jobsCount?: number
}

const experienceLevelLabels: Record<string, string> = {
    any: 'Any Level',
    entry: 'Entry Level',
    mid: 'Mid Level',
    senior: 'Senior',
    lead: 'Lead / Principal',
    executive: 'Executive',
}

// Types for enrichment preview
interface EnrichmentPreview {
    icpName: string
    totalCompanies: number
    companiesWithDomains: number
    companiesWithoutDomains: number
    enrichedCompanies: number
    unenrichedCompanies: number
    cachePreview: {
        companiesChecked: number
        companiesInCache: number
        estimatedEmployeesInCache: number
    }
    creditsRemaining: number
    savedFilters: {
        decisionMakerTitles?: string[]
        decisionMakerSeniorities?: string[]
        lastUsedAt?: string
    } | null
}

export default function ICPDetailPage() {
    const params = useParams()
    const router = useRouter()
    const icpId = params.id as string

    // Data state
    const [icp, setIcp] = useState<ICPData | null>(null)
    const [companies, setCompanies] = useState<CompanyData[]>([])
    const [scraperRuns, setScraperRuns] = useState<ScraperRunAPI[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // UI state
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [openMenu, setOpenMenu] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [activeTab, setActiveTab] = useState<'companies' | 'scrapers' | 'leads'>('scrapers')
    const [expandedScrapers, setExpandedScrapers] = useState<string[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenMenu(null)
            }
        }
        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openMenu])

    // Pagination state (from server)
    const [totalCount, setTotalCount] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const ITEMS_PER_PAGE = 10

    // Scraper run state
    const [isRunningScrapers, setIsRunningScrapers] = useState(false)
    const [showRunScrapersDialog, setShowRunScrapersDialog] = useState(false)
    const [cancellingRunId, setCancellingRunId] = useState<string | null>(null)
    const [isRerunning, setIsRerunning] = useState<number | null>(null)
    const completedScraperIdsRef = useRef<Set<string>>(new Set())
    const pollingStartTimeRef = useRef<number | null>(null)

    // Max polling duration: 15 minutes - after this, we assume something is stuck
    const MAX_POLLING_DURATION_MS = 15 * 60 * 1000

    // Quick Enrich state
    const [showEnrichModal, setShowEnrichModal] = useState(false)
    const [enrichmentPreview, setEnrichmentPreview] = useState<EnrichmentPreview | null>(null)
    const [filteredPreview, setFilteredPreview] = useState<FilteredPreviewResponse | null>(null)
    const [isLoadingPreview, setIsLoadingPreview] = useState(false)
    const [isCalculating, setIsCalculating] = useState(false)
    const [isEnriching, setIsEnriching] = useState(false)
    const [enrichTargetCompanyIds, setEnrichTargetCompanyIds] = useState<string[] | null>(null)

    // Phone enrichment polling state
    const [isPollingPhones, setIsPollingPhones] = useState(false)
    const [pendingPhoneCount, setPendingPhoneCount] = useState(0)
    const phonePollingStartRef = useRef<number | null>(null)
    const MAX_PHONE_POLLING_DURATION_MS = 5 * 60 * 1000 // 5 minutes max for phone polling

    // Leads tab state
    const [leadsSearch, setLeadsSearch] = useState('')
    const [leadsStatusFilter, setLeadsStatusFilter] = useState<string>('all')
    const [selectedLeadCompanies, setSelectedLeadCompanies] = useState<string[]>([])
    const [showExportModal, setShowExportModal] = useState(false)
    const [viewingCompanyId, setViewingCompanyId] = useState<string | null>(null)

    // ICP management modals
    const [showAddScraperModal, setShowAddScraperModal] = useState(false)
    const [showEditICPModal, setShowEditICPModal] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Use the ICP leads hook
    const {
        companiesWithLeads,
        isLoading: isLoadingLeads,
        stats: leadsStats,
        fetchData: refreshLeads,
        updateLeadStatus,
        generateAIContent,
        isAILoading,
    } = useICPLeads(icpId)

    // Fetch ICP data (initial load)
    const fetchIcpData = useCallback(async () => {
        if (!icpId) return

        try {
            setIsLoading(true)
            setError(null)

            // First, cleanup any stale runs from previous sessions
            try {
                await fetch(`/api/searches/${icpId}/runs/cleanup`, { method: 'POST' })
            } catch {
                // Ignore cleanup errors on load
            }

            const [icpResponse, runsResponse] = await Promise.all([
                fetch(`/api/searches/${icpId}`),
                fetch(`/api/searches/${icpId}/runs`),
            ])

            if (!icpResponse.ok) {
                if (icpResponse.status === 404) {
                    setError('ICP not found')
                    return
                }
                throw new Error('Failed to fetch ICP')
            }

            const icpData = await icpResponse.json()
            setIcp(icpData)

            if (runsResponse.ok) {
                const runsData = await runsResponse.json()
                setScraperRuns(runsData.runs || [])
            }
        } catch (err) {
            console.error('Error fetching data:', err)
            setError(err instanceof Error ? err.message : 'Failed to load data')
        } finally {
            setIsLoading(false)
        }
    }, [icpId])

    // Fetch companies with server-side pagination
    const fetchCompanies = useCallback(async (pageNum: number) => {
        if (!icpId) return

        try {
            const companiesResponse = await fetch(
                `/api/companies?searchId=${icpId}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`
            )
            if (companiesResponse.ok) {
                const companiesData = await companiesResponse.json()
                setCompanies(companiesData.companies || [])
                setTotalCount(companiesData.pagination?.totalCount || 0)
                setTotalPages(companiesData.pagination?.totalPages || 1)
            }
        } catch (err) {
            console.error('Error fetching companies:', err)
        }
    }, [icpId])

    const fetchData = useCallback(async () => {
        await fetchIcpData()
        await fetchCompanies(page)
    }, [fetchIcpData, fetchCompanies, page])

    useEffect(() => {
        fetchIcpData()
    }, [fetchIcpData])

    useEffect(() => {
        fetchCompanies(page)
    }, [page, fetchCompanies])

    // Run all scrapers
    const handleRunScrapers = async () => {
        if (!icpId) return

        completedScraperIdsRef.current = new Set()
        pollingStartTimeRef.current = Date.now() // Reset polling timer
        setIsRunningScrapers(true)
        setShowRunScrapersDialog(false)
        toast.info('Starting scrapers in parallel...')

        try {
            const response = await fetch(`/api/searches/${icpId}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to run scrapers')
            }

            const result = await response.json()
            toast.success(`Found ${result.totalJobsFound} jobs, ${result.totalNewCompanies} new companies.`)
            await fetchData()
        } catch (err) {
            console.error('Error running scrapers:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to run scrapers')
        } finally {
            setIsRunningScrapers(false)
        }
    }

    // Cancel a queued scraper run
    const handleCancelScraperRun = async (runId: string) => {
        if (!icpId) return

        setCancellingRunId(runId)
        try {
            const response = await fetch(`/api/searches/${icpId}/runs/${runId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to cancel scraper')
            }

            toast.success('Scraper cancelled')
            setScraperRuns((prev) =>
                prev.map((run) =>
                    run.id === runId
                        ? { ...run, status: 'cancelled' as const, completedAt: new Date().toISOString() }
                        : run
                )
            )
        } catch (err) {
            console.error('Error cancelling scraper:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to cancel scraper')
        } finally {
            setCancellingRunId(null)
        }
    }

    const refreshAfterScraperCompletion = useCallback(async () => {
        if (!icpId) return
        try {
            const icpResponse = await fetch(`/api/searches/${icpId}`)
            if (icpResponse.ok) {
                const icpData = await icpResponse.json()
                setIcp(icpData)
            }
            await fetchCompanies(page)
        } catch (err) {
            console.error('Error refreshing after scraper completion:', err)
        }
    }, [icpId, page, fetchCompanies])

    // Poll for scraper run updates with timeout protection
    useEffect(() => {
        if (!isRunningScrapers || !icpId) return

        // Track when polling started
        if (!pollingStartTimeRef.current) {
            pollingStartTimeRef.current = Date.now()
        }

        let pollCount = 0

        const pollInterval = setInterval(async () => {
            try {
                pollCount++

                // Check if we've been polling too long
                const pollingDuration = Date.now() - (pollingStartTimeRef.current || Date.now())
                if (pollingDuration > MAX_POLLING_DURATION_MS) {
                    console.warn('[Polling] Max polling duration exceeded, stopping polling')
                    toast.error('Some scrapers may have timed out. Check the scraper history for details.', {
                        duration: 5000,
                    })
                    setIsRunningScrapers(false)
                    pollingStartTimeRef.current = null

                    // Try to cleanup stale runs via API
                    try {
                        await fetch(`/api/searches/${icpId}/runs/cleanup`, { method: 'POST' })
                    } catch {
                        // Ignore cleanup errors
                    }

                    // Refresh data to show current state
                    await refreshAfterScraperCompletion()
                    return
                }

                const runsResponse = await fetch(`/api/searches/${icpId}/runs`)
                if (!runsResponse.ok) return

                const runsData = await runsResponse.json()
                const newRuns: ScraperRunAPI[] = runsData.runs || []
                setScraperRuns(newRuns)

                const currentCompleted = new Set(
                    newRuns
                        .filter(r => r.status === 'completed' || r.status === 'failed')
                        .map(r => r.id)
                )

                const newlyCompleted = [...currentCompleted].filter(
                    id => !completedScraperIdsRef.current.has(id)
                )

                // Refresh ICP data and companies when new scrapers complete
                // OR periodically every 5 polls (~10 seconds) to show intermediate updates
                if (newlyCompleted.length > 0 || pollCount % 5 === 0) {
                    if (newlyCompleted.length > 0) {
                        completedScraperIdsRef.current = currentCompleted
                    }
                    await refreshAfterScraperCompletion()
                    // Also refresh leads data to show new leads created
                    await refreshLeads()
                }

                const allDone = newRuns.length > 0 &&
                    newRuns.every(r => ['completed', 'failed', 'cancelled'].includes(r.status))
                if (allDone) {
                    setIsRunningScrapers(false)
                    pollingStartTimeRef.current = null
                    // Final refresh to ensure everything is up to date
                    await refreshAfterScraperCompletion()
                    await refreshLeads()
                }
            } catch (err) {
                console.error('Error polling scraper runs:', err)
            }
        }, 2000)

        return () => clearInterval(pollInterval)
    }, [isRunningScrapers, icpId, refreshAfterScraperCompletion, refreshLeads, MAX_POLLING_DURATION_MS])

    // Poll for phone enrichment status
    useEffect(() => {
        if (!isPollingPhones || !icpId) return

        // Track when polling started
        if (!phonePollingStartRef.current) {
            phonePollingStartRef.current = Date.now()
        }

        const pollInterval = setInterval(async () => {
            try {
                // Check if we've been polling too long
                const pollingDuration = Date.now() - (phonePollingStartRef.current || Date.now())
                if (pollingDuration > MAX_PHONE_POLLING_DURATION_MS) {
                    console.warn('[Phone Polling] Max duration exceeded, stopping polling')
                    toast.info('Phone enrichment may still be processing in the background. Refresh the page to check for updates.')
                    setIsPollingPhones(false)
                    phonePollingStartRef.current = null
                    return
                }

                // Check phone status via debug endpoint
                const response = await fetch('/api/debug/phone-status')
                if (!response.ok) return

                const data = await response.json()
                const pending = data.summary?.pending || 0

                // If pending count decreased, phones were received - refresh leads
                if (pending < pendingPhoneCount) {
                    console.log(`[Phone Polling] Phones received! Pending: ${pendingPhoneCount} -> ${pending}`)
                    await refreshLeads()
                    toast.success(`Phone numbers updated!`, { duration: 3000 })
                }

                setPendingPhoneCount(pending)

                // Stop polling when no more pending
                if (pending === 0) {
                    console.log('[Phone Polling] All phones processed, stopping polling')
                    setIsPollingPhones(false)
                    phonePollingStartRef.current = null
                    // Final refresh
                    await refreshLeads()
                }
            } catch (err) {
                console.error('Error polling phone status:', err)
            }
        }, 3000) // Poll every 3 seconds

        return () => clearInterval(pollInterval)
    }, [isPollingPhones, icpId, pendingPhoneCount, refreshLeads, MAX_PHONE_POLLING_DURATION_MS])

    // Fetch enrichment preview when modal opens
    const fetchEnrichmentPreview = useCallback(async () => {
        if (!icpId) return

        setIsLoadingPreview(true)
        try {
            const response = await fetch(`/api/icps/${icpId}/quick-enrich`)
            if (!response.ok) throw new Error('Failed to fetch preview')
            const data = await response.json()
            setEnrichmentPreview(data)
        } catch (error) {
            console.error('Error fetching enrichment preview:', error)
            toast.error('Failed to load enrichment preview')
        } finally {
            setIsLoadingPreview(false)
        }
    }, [icpId])

    const openEnrichModal = (companyIds?: string[]) => {
        setEnrichTargetCompanyIds(companyIds || null)
        setShowEnrichModal(true)
        fetchEnrichmentPreview()
    }

    const handleCalculatePreview = async (params: {
        titles: string[]
        seniorities: string[]
        fetchAll?: boolean
    }) => {
        if (!icpId) return

        setIsCalculating(true)
        try {
            const companyIds = enrichTargetCompanyIds || companies.map(c => c.id)

            const response = await fetch('/api/leads/companies/enrich/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyIds,
                    filters: {
                        titles: params.titles,
                        seniorities: params.seniorities,
                    },
                    fetchAll: params.fetchAll,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to calculate preview')
            }

            const data: FilteredPreviewResponse = await response.json()
            setFilteredPreview(data)
        } catch (error) {
            console.error('Error calculating preview:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to calculate preview')
        } finally {
            setIsCalculating(false)
        }
    }

    const handleQuickEnrich = async (
        filters: { titles: string[]; seniorities: string[]; fetchAll?: boolean; revealPhoneNumbers?: boolean },
        saveToIcp?: boolean
    ) => {
        if (!icpId) return

        setIsEnriching(true)
        try {
            const companyIds = enrichTargetCompanyIds || companies.map(c => c.id)

            const response = await fetch('/api/leads/companies/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyIds,
                    searchId: icpId,
                    filters: {
                        titles: filters.titles,
                        seniorities: filters.seniorities,
                    },
                    fetchAll: filters.fetchAll,
                    revealPhoneNumbers: filters.revealPhoneNumbers,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Enrichment failed')
            }

            const result = await response.json()

            const phoneMessage = result.phoneEnrichment?.started
                ? ` Phone enrichment started for ${result.phoneEnrichment.leadsQueued} contacts.`
                : ''

            toast.success(
                `Enriched ${result.companiesProcessed} companies! ${result.totalLeadsCreated} leads added.${phoneMessage}`
            )

            // Start phone polling if phone enrichment was requested and leads are queued
            if (result.phoneEnrichment?.started && result.phoneEnrichment.leadsQueued > 0) {
                setPendingPhoneCount(result.phoneEnrichment.leadsQueued)
                phonePollingStartRef.current = Date.now()
                setIsPollingPhones(true)
                toast.info('Fetching phone numbers... This may take a moment.', { duration: 4000 })
            }

            setShowEnrichModal(false)

            if (saveToIcp && (filters.titles.length > 0 || filters.seniorities.length > 0)) {
                await fetch(`/api/searches/${icpId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        filters: {
                            ...icp?.filters,
                            enrichmentFilters: {
                                decisionMakerTitles: filters.titles,
                                decisionMakerSeniorities: filters.seniorities,
                                lastUsedAt: new Date().toISOString(),
                            },
                        },
                    }),
                })
            }

            await fetchCompanies(page)
            await refreshLeads()
            router.refresh()
        } catch (error) {
            console.error('Error during enrichment:', error)
            toast.error(error instanceof Error ? error.message : 'Enrichment failed')
        } finally {
            setIsEnriching(false)
        }
    }

    const filteredCompanies = useMemo(() => {
        if (!searchQuery) return companies
        const query = searchQuery.toLowerCase()
        return companies.filter(
            (c) =>
                c.name.toLowerCase().includes(query) ||
                (c.domain?.toLowerCase() || '').includes(query)
        )
    }, [companies, searchQuery])

    const enrichedCount = useMemo(() => {
        return companies.filter((c) => c.isEnriched).length
    }, [companies])

    const toggleSelectAll = useCallback(() => {
        if (selectedCompanies.length === filteredCompanies.length) {
            setSelectedCompanies([])
        } else {
            setSelectedCompanies(filteredCompanies.map((c) => c.id))
        }
    }, [selectedCompanies.length, filteredCompanies])

    const toggleSelect = useCallback((id: string) => {
        setSelectedCompanies((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }, [])

    const toggleLeadCompanySelect = useCallback((selected: boolean, companyId: string) => {
        setSelectedLeadCompanies((prev) =>
            selected ? [...prev, companyId] : prev.filter((i) => i !== companyId)
        )
    }, [])

    const filteredCompaniesWithLeads = useMemo(() => {
        return companiesWithLeads.filter((cwl) => {
            const matchesSearch = !leadsSearch ||
                cwl.company.name.toLowerCase().includes(leadsSearch.toLowerCase()) ||
                cwl.company.domain?.toLowerCase().includes(leadsSearch.toLowerCase()) ||
                cwl.leads.some(l =>
                    `${l.firstName} ${l.lastName}`.toLowerCase().includes(leadsSearch.toLowerCase())
                )

            const matchesStatus = leadsStatusFilter === 'all' ||
                cwl.leads.some(l => l.status === leadsStatusFilter)

            return matchesSearch && matchesStatus
        })
    }, [companiesWithLeads, leadsSearch, leadsStatusFilter])

    const handleLeadStatusChange = useCallback(async (leadId: string, status: string) => {
        try {
            await updateLeadStatus(leadId, status as 'new' | 'contacted' | 'qualified' | 'rejected')
        } catch {
            toast.error('Failed to update lead status')
        }
    }, [updateLeadStatus])

    const handleGenerateAI = useCallback(async (companyId: string, type: AIContentType, regenerate?: boolean) => {
        try {
            await generateAIContent(companyId, type, regenerate)
            toast.success(`${type === 'insights' ? 'AI Insights' : 'Outreach Playbook'} generated`)
        } catch {
            toast.error(`Failed to generate ${type === 'insights' ? 'insights' : 'playbook'}`)
        }
    }, [generateAIContent])

    const toggleScraperExpanded = useCallback((id: string) => {
        setExpandedScrapers((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }, [])

    // Delete ICP handler
    const handleDeleteICP = async () => {
        if (!icpId) return

        const response = await fetch(`/api/searches/${icpId}`, {
            method: 'DELETE',
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete ICP')
        }

        toast.success('ICP deleted successfully')
        router.push('/dashboard/icps')
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}m ${secs}s`
    }

    const scrapers = icp?.filters?.scrapers || []

    // Check if any scraper is currently running
    const isAnyScraperRunning = scraperRuns.some(r => r.status === 'running' || r.status === 'queued') || isRunningScrapers

    // Handle rerunning a single scraper
    const handleRerunScraper = async (scraperIndex: number) => {
        if (!icpId) return

        setIsRerunning(scraperIndex)
        try {
            const response = await fetch(`/api/searches/${icpId}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scraperIndex }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to run scraper')
            }

            toast.success('Scraper started', {
                description: `Running ${scrapers[scraperIndex]?.jobTitle} scraper`,
            })

            // Reset polling timer and trigger polling for updates
            pollingStartTimeRef.current = Date.now()
            setIsRunningScrapers(true)
        } catch (err) {
            toast.error('Failed to run scraper', {
                description: err instanceof Error ? err.message : 'Unknown error',
            })
        } finally {
            setIsRerunning(null)
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <Loader2 className="size-6 animate-spin text-black/30 dark:text-white/30" />
            </div>
        )
    }

    // Error state
    if (error || !icp) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                    <AlertCircle className="size-12 text-red-500" />
                    <h2 className="text-lg font-semibold text-black dark:text-white">
                        {error || 'ICP not found'}
                    </h2>
                    <Link href="/dashboard/icps">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 size-4" />
                            Back to ICPs
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/icps">
                        <button className="flex size-9 items-center justify-center rounded-lg border border-black/10 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white">
                            <ArrowLeft className="size-4" />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-black dark:text-white">{icp.name}</h1>
                            {scrapers.length > 0 && (
                                <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
                                    {scrapers.length} scraper{scrapers.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {icp.description && (
                            <p className="mt-1 text-sm text-black/50 dark:text-white/50">{icp.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => openEnrichModal()}
                        className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        <Sparkles className="mr-2 size-4" />
                        Enrich
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setShowRunScrapersDialog(true)}
                        disabled={isRunningScrapers || scrapers.length === 0}
                        className="h-9 rounded-full border-black/10 px-4 text-sm font-medium dark:border-white/10"
                    >
                        {isRunningScrapers ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <Play className="mr-2 size-4" />
                        )}
                        {isRunningScrapers ? 'Running...' : 'Run Scrapers'}
                    </Button>
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setOpenMenu(openMenu === 'actions' ? null : 'actions')}
                            className="size-9 rounded-full border-black/10 dark:border-white/10"
                        >
                            <MoreVertical className="size-4" />
                        </Button>
                        {openMenu === 'actions' && (
                            <div className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[#0a0a0f]">
                                <button
                                    onClick={() => {
                                        setShowEditICPModal(true)
                                        setOpenMenu(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"
                                >
                                    <Edit2 className="size-4" />
                                    Edit
                                </button>
                                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-black/70 transition-colors hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5">
                                    <Download className="size-4" />
                                    Export
                                </button>
                                <div className="my-1 h-px bg-black/5 dark:bg-white/5" />
                                <button
                                    onClick={() => {
                                        setShowDeleteDialog(true)
                                        setOpenMenu(null)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                >
                                    <Trash2 className="size-4" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 border-b border-black/5 pb-6 dark:border-white/5">
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{icp.resultsCount || 0}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Companies</div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{icp.jobsCount || 0}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Jobs scraped</div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{enrichedCount}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Enriched</div>
                </div>
                <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                <div>
                    <div className="text-3xl font-semibold text-black dark:text-white">{leadsStats.totalContacts}</div>
                    <div className="mt-1 text-sm text-black/50 dark:text-white/50">Leads</div>
                </div>
                {/* Phone polling indicator */}
                {isPollingPhones && (
                    <>
                        <div className="h-10 w-px bg-black/10 dark:bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin text-blue-500" />
                            <div>
                                <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    Fetching phones...
                                </div>
                                <div className="text-xs text-black/50 dark:text-white/50">
                                    {pendingPhoneCount} pending
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-black/5 dark:border-white/5">
                {[
                    { id: 'scrapers', label: 'Scrapers', count: scrapers.length, icon: Search },
                    { id: 'companies', label: 'Companies', count: totalCount, icon: Building2 },
                    { id: 'leads', label: 'Leads', count: leadsStats.totalContacts, icon: Users },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            'relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors',
                            activeTab === tab.id
                                ? 'text-black dark:text-white'
                                : 'text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60'
                        )}
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                        <span className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium',
                            activeTab === tab.id
                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                : 'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60'
                        )}>
                            {tab.count}
                        </span>
                        {activeTab === tab.id && (
                            <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-black dark:bg-white" />
                        )}
                    </button>
                ))}
            </div>

            {/* Scrapers Tab */}
            {activeTab === 'scrapers' && (
                <div className="space-y-4">
                    {/* Add Scraper Button */}
                    <div className="flex justify-end">
                        <Button
                            onClick={() => setShowAddScraperModal(true)}
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-full border-black/10 px-3 text-xs dark:border-white/10"
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            Add Scraper
                        </Button>
                    </div>
                    {scrapers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 py-16 dark:border-white/10">
                            <Search className="size-10 text-black/20 dark:text-white/20" />
                            <h3 className="mt-3 text-sm font-medium text-black dark:text-white">No scrapers configured</h3>
                            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                                Click &quot;Add Scraper&quot; to configure your first job scraper
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scrapers.map((scraper, idx) => {
                                const scraperId = `scraper-${idx}`
                                const isExpanded = expandedScrapers.includes(scraperId)
                                const scraperRunHistory = scraperRuns.filter(r => r.scraperIndex === idx)
                                const totalJobs = scraperRunHistory.reduce((sum, r) => sum + (r.jobsFound || 0), 0)
                                const totalCompanies = scraperRunHistory.reduce((sum, r) => sum + (r.newCompanies || 0), 0)

                                return (
                                    <div
                                        key={scraperId}
                                        className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.02]"
                                    >
                                        <div
                                            className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                                            onClick={() => toggleScraperExpanded(scraperId)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex size-10 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                                                    <Briefcase className="size-5 text-black/60 dark:text-white/60" />
                                                </div>
                                                <div>
                                                    <h3 className="font-medium text-black dark:text-white">{scraper.jobTitle}</h3>
                                                    <div className="flex items-center gap-3 text-xs text-black/40 dark:text-white/40">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="size-3" />
                                                            {scraper.location || 'Any'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <GraduationCap className="size-3" />
                                                            {experienceLevelLabels[scraper.experienceLevel] || 'Any'}
                                                        </span>
                                                        {/* Job Board Logos */}
                                                        {icp?.filters?.jobBoards && icp.filters.jobBoards.length > 0 && (
                                                            <span className="flex items-center gap-1 border-l border-black/10 pl-3 dark:border-white/10">
                                                                {icp.filters.jobBoards.slice(0, 3).map(boardId => {
                                                                    const board = getJobBoardById(boardId)
                                                                    if (!board) return null
                                                                    const Icon = board.Icon
                                                                    return (
                                                                        <Icon
                                                                            key={boardId}
                                                                            className={cn('size-3.5', board.color)}
                                                                        />
                                                                    )
                                                                })}
                                                                {icp.filters.jobBoards.length > 3 && (
                                                                    <span className="text-[10px]">+{icp.filters.jobBoards.length - 3}</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {/* Rerun button */}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleRerunScraper(idx)
                                                    }}
                                                    disabled={isRerunning === idx || isAnyScraperRunning}
                                                    className="h-8 gap-1.5 rounded-full border-black/10 px-3 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                                                >
                                                    {isRerunning === idx ? (
                                                        <Loader2 className="size-3 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="size-3" />
                                                    )}
                                                    Rerun
                                                </Button>
                                                <div className="flex items-center gap-4 text-xs">
                                                    <div className="text-center">
                                                        <div className="font-semibold text-black dark:text-white">{scraperRunHistory.length}</div>
                                                        <div className="text-black/40 dark:text-white/40">runs</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-semibold text-black dark:text-white">{totalJobs}</div>
                                                        <div className="text-black/40 dark:text-white/40">jobs</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="font-semibold text-black dark:text-white">{totalCompanies}</div>
                                                        <div className="text-black/40 dark:text-white/40">companies</div>
                                                    </div>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="size-5 text-black/40 dark:text-white/40" />
                                                ) : (
                                                    <ChevronDown className="size-5 text-black/40 dark:text-white/40" />
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && scraperRunHistory.length > 0 && (
                                            <div className="border-t border-black/5 bg-black/[0.01] p-4 dark:border-white/5 dark:bg-white/[0.01]">
                                                <h4 className="mb-3 text-xs font-medium text-black/50 dark:text-white/50">Run History</h4>
                                                <div className="space-y-2">
                                                    {scraperRunHistory.map((run) => (
                                                        <div
                                                            key={run.id}
                                                            className="flex items-center justify-between rounded-lg border border-black/5 bg-white px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    'flex size-8 items-center justify-center rounded-lg',
                                                                    run.status === 'completed' ? 'bg-green-100 dark:bg-green-500/20' :
                                                                    run.status === 'failed' ? 'bg-red-100 dark:bg-red-500/20' :
                                                                    run.status === 'running' ? 'bg-blue-100 dark:bg-blue-500/20' :
                                                                    'bg-black/5 dark:bg-white/10'
                                                                )}>
                                                                    {run.status === 'completed' ? (
                                                                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                                                                    ) : run.status === 'failed' ? (
                                                                        <XCircle className="size-4 text-red-600 dark:text-red-400" />
                                                                    ) : run.status === 'running' ? (
                                                                        <RefreshCw className="size-4 animate-spin text-blue-600 dark:text-blue-400" />
                                                                    ) : (
                                                                        <Clock className="size-4 text-black/40 dark:text-white/40" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 text-sm">
                                                                        <span className="font-medium text-black dark:text-white">
                                                                            {run.startedAt ? formatDate(run.startedAt) : 'Queued'}
                                                                        </span>
                                                                        <span className={cn(
                                                                            'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                                                                            run.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                                                                            run.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                                                            run.status === 'running' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                                                            'bg-black/5 text-black/60 dark:bg-white/10 dark:text-white/60'
                                                                        )}>
                                                                            {run.status}
                                                                        </span>
                                                                    </div>
                                                                    {run.duration && (
                                                                        <div className="text-xs text-black/40 dark:text-white/40">
                                                                            Duration: {formatDuration(run.duration)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs">
                                                                {run.status === 'queued' ? (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleCancelScraperRun(run.id)
                                                                        }}
                                                                        disabled={cancellingRunId === run.id}
                                                                        className="h-7 border-red-200 text-red-500 hover:bg-red-50"
                                                                    >
                                                                        {cancellingRunId === run.id ? (
                                                                            <Loader2 className="mr-1 size-3 animate-spin" />
                                                                        ) : (
                                                                            <XCircle className="mr-1 size-3" />
                                                                        )}
                                                                        Cancel
                                                                    </Button>
                                                                ) : (
                                                                    <>
                                                                        <div className="text-center">
                                                                            <div className="font-semibold text-black dark:text-white">{run.jobsFound || 0}</div>
                                                                            <div className="text-black/40 dark:text-white/40">jobs</div>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="font-semibold text-green-600 dark:text-green-400">+{run.newCompanies || 0}</div>
                                                                            <div className="text-black/40 dark:text-white/40">new</div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Companies Tab */}
            {activeTab === 'companies' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
                            <input
                                type="text"
                                placeholder="Search companies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-black/10 bg-white pl-9 pr-4 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                            />
                        </div>
                        {selectedCompanies.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-black/50 dark:text-white/50">{selectedCompanies.length} selected</span>
                                <Button
                                    onClick={() => openEnrichModal(selectedCompanies)}
                                    className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                >
                                    <UserPlus className="mr-2 size-4" />
                                    Enrich Selected
                                </Button>
                            </div>
                        )}
                    </div>

                    {filteredCompanies.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 py-16 dark:border-white/10">
                            <Building2 className="size-10 text-black/20 dark:text-white/20" />
                            <h3 className="mt-3 text-sm font-medium text-black dark:text-white">No companies yet</h3>
                            <p className="mt-1 text-xs text-black/50 dark:text-white/50">Run scrapers to find companies</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
                            <table className="w-full table-fixed">
                                <thead>
                                    <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                                        <th className="w-10 px-3 py-3">
                                            <button
                                                onClick={toggleSelectAll}
                                                className={cn(
                                                    'flex size-4 items-center justify-center rounded border transition-colors',
                                                    selectedCompanies.length === filteredCompanies.length
                                                        ? 'border-black bg-black dark:border-white dark:bg-white'
                                                        : 'border-black/20 dark:border-white/20'
                                                )}
                                            >
                                                {selectedCompanies.length === filteredCompanies.length && (
                                                    <Check className="size-2.5 text-white dark:text-black" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="w-[220px] px-3 py-3 text-left text-xs font-medium text-black/50 dark:text-white/50">Company</th>
                                        <th className="w-[130px] px-3 py-3 text-left text-xs font-medium text-black/50 dark:text-white/50">Industry</th>
                                        <th className="w-[100px] px-3 py-3 text-left text-xs font-medium text-black/50 dark:text-white/50">Size</th>
                                        <th className="w-[130px] px-3 py-3 text-left text-xs font-medium text-black/50 dark:text-white/50">Location</th>
                                        <th className="w-[80px] px-3 py-3 text-center text-xs font-medium text-black/50 dark:text-white/50">Jobs</th>
                                        <th className="w-[80px] px-3 py-3 text-center text-xs font-medium text-black/50 dark:text-white/50">Leads</th>
                                        <th className="w-[72px] px-3 py-3 text-right text-xs font-medium text-black/50 dark:text-white/50">Links</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {filteredCompanies.map((company) => (
                                        <tr key={company.id} className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                                            <td className="px-3 py-3">
                                                <button
                                                    onClick={() => toggleSelect(company.id)}
                                                    className={cn(
                                                        'flex size-4 items-center justify-center rounded border transition-colors',
                                                        selectedCompanies.includes(company.id)
                                                            ? 'border-black bg-black dark:border-white dark:bg-white'
                                                            : 'border-black/20 dark:border-white/20'
                                                    )}
                                                >
                                                    {selectedCompanies.includes(company.id) && (
                                                        <Check className="size-2.5 text-white dark:text-black" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        {company.logoUrl ? (
                                                            <img src={company.logoUrl} alt="" className="size-8 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="flex size-8 items-center justify-center rounded-lg bg-black/5 text-xs font-bold text-black/60 dark:bg-white/5 dark:text-white/60">
                                                                {company.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-black dark:text-white">{company.name}</div>
                                                        <div className="truncate text-xs text-black/40 dark:text-white/40">{company.domain || 'No domain'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="block truncate text-sm text-black/60 dark:text-white/60">{company.industry || '-'}</span>
                                            </td>
                                            <td className="px-3 py-3">
                                                {company.size ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                                        <Users className="size-3" />
                                                        {company.size.replace(' employees', '')}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-black/30 dark:text-white/30">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="block truncate text-sm text-black/60 dark:text-white/60">{company.location || '-'}</span>
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {(company.jobsCount || 0) > 0 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-500/20 dark:text-green-400">
                                                        <Briefcase className="size-3" />
                                                        {company.jobsCount}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-black/30 dark:text-white/30">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                {(company.leadsCount || 0) > 0 ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
                                                        <Users className="size-3" />
                                                        {company.leadsCount}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-black/30 dark:text-white/30">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {company.websiteUrl && (
                                                        <a
                                                            href={company.websiteUrl.startsWith('http') ? company.websiteUrl : `https://${company.websiteUrl}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1.5 text-black/30 hover:bg-black/5 hover:text-black dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-white"
                                                            title="Website"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                        </a>
                                                    )}
                                                    {company.linkedinUrl && (
                                                        <a
                                                            href={company.linkedinUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded p-1.5 text-black/30 hover:bg-black/5 hover:text-blue-600 dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-blue-400"
                                                            title="LinkedIn"
                                                        >
                                                            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                                            </svg>
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-black/50 dark:text-white/50">
                                Page {page} of {totalPages} ({totalCount} companies)
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="flex size-8 items-center justify-center rounded-lg border border-black/10 text-black/60 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="flex size-8 items-center justify-center rounded-lg border border-black/10 text-black/60 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Leads Tab */}
            {activeTab === 'leads' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-black/40 dark:text-white/40" />
                            <input
                                type="text"
                                placeholder="Search leads..."
                                value={leadsSearch}
                                onChange={(e) => setLeadsSearch(e.target.value)}
                                className="h-9 w-full rounded-lg border border-black/10 bg-white pl-9 pr-4 text-sm placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:placeholder:text-white/40 dark:focus:border-white/20"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 rounded-lg border border-black/10 p-1 dark:border-white/10">
                                {['all', 'new', 'contacted', 'qualified'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setLeadsStatusFilter(status)}
                                        className={cn(
                                            'rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                                            leadsStatusFilter === status
                                                ? 'bg-black text-white dark:bg-white dark:text-black'
                                                : 'text-black/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/5'
                                        )}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <Button
                                onClick={() => setShowExportModal(true)}
                                disabled={leadsStats.totalContacts === 0}
                                className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                            >
                                <Download className="mr-2 size-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    {isLoadingLeads ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="size-6 animate-spin text-black/30 dark:text-white/30" />
                        </div>
                    ) : filteredCompaniesWithLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-black/10 py-16 dark:border-white/10">
                            <Users className="size-10 text-black/20 dark:text-white/20" />
                            <h3 className="mt-3 text-sm font-medium text-black dark:text-white">No leads found</h3>
                            <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                                {leadsSearch || leadsStatusFilter !== 'all' ? 'Try adjusting your filters' : 'Enrich companies to add leads'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredCompaniesWithLeads.map((cwl) => (
                                <CompanyLeadCard
                                    key={cwl.company.id}
                                    data={cwl}
                                    isSelected={selectedLeadCompanies.includes(cwl.company.id)}
                                    onSelect={(selected) => toggleLeadCompanySelect(selected, cwl.company.id)}
                                    onViewDetails={() => setViewingCompanyId(cwl.company.id)}
                                    onStatusChange={handleLeadStatusChange}
                                    onGenerateAI={handleGenerateAI}
                                    isAILoading={isAILoading}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <CRMExportModal
                companies={filteredCompaniesWithLeads}
                selectedCompanyIds={selectedLeadCompanies.length > 0 ? selectedLeadCompanies : undefined}
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />

            <RunScrapersDialog
                isOpen={showRunScrapersDialog}
                onClose={() => setShowRunScrapersDialog(false)}
                onConfirm={handleRunScrapers}
                scrapers={scrapers}
                isRunning={isRunningScrapers}
            />

            <EnrichmentFilterModal
                open={showEnrichModal}
                onOpenChange={(open) => {
                    setShowEnrichModal(open)
                    if (!open) {
                        setFilteredPreview(null)
                        setEnrichTargetCompanyIds(null)
                    }
                }}
                onEnrich={handleQuickEnrich}
                onCalculatePreview={handleCalculatePreview}
                icp={{
                    id: icpId,
                    name: icp.name,
                    companiesCount: enrichTargetCompanyIds?.length || icp.resultsCount || totalCount,
                }}
                cachePreview={enrichmentPreview?.cachePreview || null}
                filteredPreview={filteredPreview}
                savedFilters={enrichmentPreview?.savedFilters ? {
                    titles: enrichmentPreview.savedFilters.decisionMakerTitles,
                    seniorities: enrichmentPreview.savedFilters.decisionMakerSeniorities,
                } : null}
                creditsRemaining={filteredPreview?.creditsRemaining ?? enrichmentPreview?.creditsRemaining ?? 0}
                isCalculating={isCalculating}
                isEnriching={isEnriching}
                showFetchAllOption={true}
            />

            <AddScraperModal
                icpId={icpId}
                icpName={icp.name}
                existingScrapers={scrapers}
                existingFilters={icp.filters || {}}
                open={showAddScraperModal}
                onOpenChange={setShowAddScraperModal}
                onSuccess={fetchData}
            />

            <EditICPModal
                icp={icp}
                open={showEditICPModal}
                onOpenChange={setShowEditICPModal}
                onSuccess={fetchData}
            />

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete ICP"
                description="Are you sure you want to delete this ICP? All associated data will be permanently removed."
                itemName={icp.name}
                stats={[
                    { label: 'companies', value: icp.resultsCount || 0 },
                    { label: 'jobs scraped', value: icp.jobsCount || 0 },
                    { label: 'leads', value: leadsStats.totalContacts },
                ]}
                onConfirm={handleDeleteICP}
            />
        </div>
    )
}
