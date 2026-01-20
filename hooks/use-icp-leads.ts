'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Lead, Company, Job } from '@/lib/db/schema'
import type { AIInsights, OutreachPlaybook } from '@/lib/mock-ai-content'

// Re-export types from use-crm-leads
export type { AIInsights, OutreachPlaybook }

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

export interface ICPLeadsStats {
  totalCompanies: number
  totalContacts: number
  newThisWeek: number
  readyToExport: number
}

export type AIContentType = 'insights' | 'playbook'

export function useICPLeads(icpId: string) {
  const [leads, setLeads] = useState<LeadWithCompany[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiLoadingStates, setAiLoadingStates] = useState<Record<string, boolean>>({})

  const fetchData = useCallback(async () => {
    if (!icpId) return

    try {
      setIsLoading(true)

      // Fetch leads and jobs filtered by ICP in parallel
      // Use a higher limit for ICP detail page to show more data
      const [leadsResponse, jobsResponse] = await Promise.all([
        fetch(`/api/leads?searchId=${icpId}&limit=100`),
        fetch(`/api/jobs?searchId=${icpId}&limit=200`),
      ])

      if (!leadsResponse.ok) throw new Error('Failed to fetch leads')
      if (!jobsResponse.ok) throw new Error('Failed to fetch jobs')

      const leadsData = await leadsResponse.json()
      const jobsData = await jobsResponse.json()

      // Handle paginated responses from APIs
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
  }, [icpId])

  useEffect(() => {
    fetchData()
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
    const companyMap = new Map<string, CompanyWithLeads>()

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

  // Calculate stats
  const stats = useMemo((): ICPLeadsStats => {
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
    companiesWithLeads,
    leads,
    jobs,
    isLoading,
    error,
    stats,
    fetchData,
    updateLeadStatus,
    generateAIContent,
    isAILoading,
    aiLoadingStates,
  }
}
