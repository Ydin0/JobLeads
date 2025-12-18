'use client'

import { useState, useCallback, useEffect } from 'react'

// Types
export interface ProspectFilters {
  // People filters
  jobTitles?: string[]
  seniorities?: string[]
  departments?: string[]
  // Company filters (used for both)
  companyIds?: string[]
  industries?: string[]
  sizes?: string[]
  locations?: string[]
  // Status filters
  isEnriched?: boolean
  isShortlisted?: boolean
  hasContacts?: boolean
}

export interface PersonProspect {
  id: string
  orgId: string
  companyId: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  jobTitle: string | null
  linkedinUrl: string | null
  location: string | null
  seniority: string | null
  department: string | null
  isShortlisted: boolean
  apolloId: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  company: {
    id: string
    name: string
    logoUrl: string | null
    industry: string | null
    domain: string | null
  } | null
}

export interface CompanyProspect {
  id: string
  orgId: string
  searchId: string | null
  name: string
  domain: string | null
  industry: string | null
  size: string | null
  location: string | null
  description: string | null
  logoUrl: string | null
  linkedinUrl: string | null
  websiteUrl: string | null
  isEnriched: boolean
  enrichedAt: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  employeesCount: number
  leadsCount: number
  jobsCount: number
  hiringSignals: {
    totalJobs: number
    recentJobs: number
    departmentBreakdown: Record<string, number>
    topTech: string[]
    hiringIntensity: number
  }
}

export interface ProspectStats {
  total: number
  netNew: number
  enriched: number
  leads: number
}

export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

interface UseProspectsOptions {
  view: 'people' | 'companies'
  page?: number
  limit?: number
  search?: string
  filters?: ProspectFilters
}

interface UseProspectsReturn {
  data: PersonProspect[] | CompanyProspect[]
  isLoading: boolean
  error: string | null
  stats: ProspectStats
  pagination: PaginationInfo
  refetch: () => Promise<void>
  promoteToLeads: (ids: string[]) => Promise<{ success: boolean; count: number }>
}

export function useProspects({
  view,
  page = 1,
  limit = 50,
  search = '',
  filters = {},
}: UseProspectsOptions): UseProspectsReturn {
  const [data, setData] = useState<PersonProspect[] | CompanyProspect[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ProspectStats>({
    total: 0,
    netNew: 0,
    enriched: 0,
    leads: 0,
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 1,
  })

  const fetchProspects = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        view,
        page: page.toString(),
        limit: limit.toString(),
      })

      if (search) {
        params.set('search', search)
      }

      // Only include non-empty filters
      const activeFilters: ProspectFilters = {}
      if (filters.jobTitles?.length) activeFilters.jobTitles = filters.jobTitles
      if (filters.seniorities?.length) activeFilters.seniorities = filters.seniorities
      if (filters.departments?.length) activeFilters.departments = filters.departments
      if (filters.companyIds?.length) activeFilters.companyIds = filters.companyIds
      if (filters.industries?.length) activeFilters.industries = filters.industries
      if (filters.sizes?.length) activeFilters.sizes = filters.sizes
      if (filters.locations?.length) activeFilters.locations = filters.locations
      if (filters.isEnriched !== undefined) activeFilters.isEnriched = filters.isEnriched
      if (filters.isShortlisted !== undefined) activeFilters.isShortlisted = filters.isShortlisted
      if (filters.hasContacts !== undefined) activeFilters.hasContacts = filters.hasContacts

      if (Object.keys(activeFilters).length > 0) {
        params.set('filters', JSON.stringify(activeFilters))
      }

      const response = await fetch(`/api/prospects?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch prospects')
      }

      const result = await response.json()

      setData(result.data)
      setStats(result.stats)
      setPagination(result.pagination)
    } catch (err) {
      console.error('Error fetching prospects:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prospects')
    } finally {
      setIsLoading(false)
    }
  }, [view, page, limit, search, filters])

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchProspects()
  }, [fetchProspects])

  // Promote people to leads
  const promoteToLeads = useCallback(async (ids: string[]): Promise<{ success: boolean; count: number }> => {
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'promoteToLeads',
          ids,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to promote to leads')
      }

      const result = await response.json()

      // Refetch to update the list
      await fetchProspects()

      return { success: true, count: result.count }
    } catch (err) {
      console.error('Error promoting to leads:', err)
      return { success: false, count: 0 }
    }
  }, [fetchProspects])

  return {
    data,
    isLoading,
    error,
    stats,
    pagination,
    refetch: fetchProspects,
    promoteToLeads,
  }
}

// Helper to get distinct filter values
export async function fetchFilterOptions(): Promise<{
  jobTitles: string[]
  seniorities: string[]
  departments: string[]
  industries: string[]
  sizes: string[]
  companies: { id: string; name: string }[]
}> {
  try {
    const response = await fetch('/api/prospects/filters')
    if (!response.ok) throw new Error('Failed to fetch filters')
    return await response.json()
  } catch {
    return {
      jobTitles: [],
      seniorities: ['owner', 'founder', 'c_suite', 'partner', 'vp', 'head', 'director', 'manager', 'senior', 'entry'],
      departments: ['engineering', 'sales', 'marketing', 'hr', 'finance', 'operations', 'design', 'product', 'customer_success', 'legal'],
      industries: [],
      sizes: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
      companies: [],
    }
  }
}
