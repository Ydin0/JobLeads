'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Lead, Company, Job } from '@/lib/db/schema'
import type { AIInsights, OutreachPlaybook } from '@/lib/mock-ai-content'
import { onSearchCompleted, onDataRefresh } from '@/lib/events'

// Re-export types
export type { AIInsights, OutreachPlaybook }

// Extended types for CRM view
export interface LeadWithCompany extends Lead {
    company: Company | null
}

export interface CompanyWithLeads {
    company: Company
    leads: LeadWithCompany[]
    jobs: Job[]
    aiInsights: AIInsights | null
    outreachPlaybook: OutreachPlaybook | null
    hasAiInsights: boolean
    hasOutreachPlaybook: boolean
}

export interface CRMFilters {
    search: string
    industry: string
    status: string
    size: string
}

export interface CRMStats {
    totalCompanies: number
    totalContacts: number
    newThisWeek: number
    readyToExport: number
}

export type AIContentType = 'insights' | 'playbook'

export function useCRMLeads() {
    const [leads, setLeads] = useState<LeadWithCompany[]>([])
    const [jobs, setJobs] = useState<Job[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filters, setFilters] = useState<CRMFilters>({
        search: '',
        industry: 'all',
        status: 'all',
        size: 'all',
    })
    const [aiLoadingStates, setAiLoadingStates] = useState<Record<string, boolean>>({})

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true)

            // Fetch leads and jobs in parallel with pagination
            const [leadsResponse, jobsResponse] = await Promise.all([
                fetch('/api/leads?limit=100'),
                fetch('/api/jobs?limit=200'),
            ])

            if (!leadsResponse.ok) throw new Error('Failed to fetch leads')
            if (!jobsResponse.ok) throw new Error('Failed to fetch jobs')

            const leadsData = await leadsResponse.json()
            const jobsData = await jobsResponse.json()

            // Handle paginated responses
            const leadsArray = leadsData.leads || leadsData
            const jobsArray = jobsData.jobs || jobsData
            setLeads(leadsArray)
            setJobs(jobsArray)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Listen for search completed events and refresh data
    useEffect(() => {
        const unsubscribeSearch = onSearchCompleted(() => {
            fetchData()
        })
        const unsubscribeRefresh = onDataRefresh(() => {
            fetchData()
        })
        return () => {
            unsubscribeSearch()
            unsubscribeRefresh()
        }
    }, [fetchData])

    // Generate AI content for a company
    const generateAIContent = useCallback(
        async (companyId: string, type: AIContentType, regenerate = false) => {
            const loadingKey = `${companyId}-${type}`
            setAiLoadingStates((prev) => ({ ...prev, [loadingKey]: true }))

            try {
                const endpoint =
                    type === 'insights'
                        ? `/api/companies/${companyId}/ai-insights`
                        : `/api/companies/${companyId}/outreach-playbook`

                const response = await fetch(
                    `${endpoint}${regenerate ? '?regenerate=true' : ''}`,
                    { method: 'POST' }
                )

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || 'Failed to generate AI content')
                }

                const data = await response.json()

                // Refresh data to get updated company metadata
                await fetchData()

                return data
            } catch (err) {
                console.error('Error generating AI content:', err)
                throw err
            } finally {
                setAiLoadingStates((prev) => ({ ...prev, [loadingKey]: false }))
            }
        },
        [fetchData]
    )

    // Check if AI content is loading for a company
    const isAILoading = useCallback(
        (companyId: string, type: AIContentType) => {
            return aiLoadingStates[`${companyId}-${type}`] || false
        },
        [aiLoadingStates]
    )

    // Group leads by company and extract cached AI content from metadata
    const companiesWithLeads = useMemo((): CompanyWithLeads[] => {
        // Create a map of companies
        const companyMap = new Map<string, CompanyWithLeads>()

        // Group leads by company
        leads.forEach((lead) => {
            if (!lead.company) return

            const companyId = lead.company.id
            if (!companyMap.has(companyId)) {
                // Get jobs for this company
                const companyJobs = jobs.filter((job) => job.companyId === companyId)

                // Extract cached AI content from company metadata
                const metadata = (lead.company.metadata as Record<string, unknown>) || {}
                const aiInsights = (metadata.aiInsights as AIInsights) || null
                const outreachPlaybook = (metadata.outreachPlaybook as OutreachPlaybook) || null

                companyMap.set(companyId, {
                    company: lead.company,
                    leads: [],
                    jobs: companyJobs,
                    aiInsights,
                    outreachPlaybook,
                    hasAiInsights: !!aiInsights,
                    hasOutreachPlaybook: !!outreachPlaybook,
                })
            }

            companyMap.get(companyId)!.leads.push(lead)
        })

        return Array.from(companyMap.values())
    }, [leads, jobs])

    // Apply filters
    const filteredCompanies = useMemo((): CompanyWithLeads[] => {
        return companiesWithLeads.filter((item) => {
            const { company, leads: companyLeads } = item

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase()
                const matchesCompany =
                    company.name.toLowerCase().includes(searchLower) ||
                    company.domain?.toLowerCase().includes(searchLower)
                const matchesLead = companyLeads.some(
                    (lead) =>
                        lead.firstName.toLowerCase().includes(searchLower) ||
                        lead.lastName.toLowerCase().includes(searchLower) ||
                        lead.email?.toLowerCase().includes(searchLower)
                )
                if (!matchesCompany && !matchesLead) return false
            }

            // Industry filter
            if (filters.industry !== 'all') {
                if (company.industry?.toLowerCase() !== filters.industry.toLowerCase()) {
                    return false
                }
            }

            // Status filter
            if (filters.status !== 'all') {
                const hasStatus = companyLeads.some((lead) => lead.status === filters.status)
                if (!hasStatus) return false
            }

            // Size filter
            if (filters.size !== 'all') {
                if (company.size !== filters.size) return false
            }

            return true
        })
    }, [companiesWithLeads, filters])

    // Calculate stats
    const stats = useMemo((): CRMStats => {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

        const newLeadsThisWeek = leads.filter(
            (lead) => new Date(lead.createdAt) > oneWeekAgo
        )

        // Get unique companies from new leads
        const newCompanyIds = new Set(
            newLeadsThisWeek.map((l) => l.company?.id).filter(Boolean)
        )

        // Ready to export = leads with email
        const readyToExport = leads.filter((lead) => lead.email).length

        return {
            totalCompanies: companiesWithLeads.length,
            totalContacts: leads.length,
            newThisWeek: newCompanyIds.size,
            readyToExport,
        }
    }, [leads, companiesWithLeads])

    // Get unique industries for filter dropdown
    const industries = useMemo(() => {
        const industrySet = new Set<string>()
        companiesWithLeads.forEach((item) => {
            if (item.company.industry) {
                industrySet.add(item.company.industry)
            }
        })
        return Array.from(industrySet).sort()
    }, [companiesWithLeads])

    // Get unique sizes for filter dropdown
    const sizes = useMemo(() => {
        const sizeSet = new Set<string>()
        companiesWithLeads.forEach((item) => {
            if (item.company.size) {
                sizeSet.add(item.company.size)
            }
        })
        return Array.from(sizeSet).sort()
    }, [companiesWithLeads])

    // Update lead status
    const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
        const response = await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        })
        if (!response.ok) throw new Error('Failed to update lead')
        const updated = await response.json()
        setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updated } : l)))
        return updated
    }

    return {
        companiesWithLeads: filteredCompanies,
        allCompanies: companiesWithLeads,
        leads,
        jobs,
        isLoading,
        error,
        filters,
        setFilters,
        stats,
        industries,
        sizes,
        fetchData,
        updateLeadStatus,
        generateAIContent,
        isAILoading,
        aiLoadingStates,
    }
}
