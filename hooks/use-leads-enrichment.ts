import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface CacheStatus {
  exists: boolean
  employeesCount: number
  isStale: boolean
  lastFetchedAt: Date | null
}

interface CompanyPreview {
  id: string
  name: string
  domain: string | null
  hasDomain: boolean
  isEnriched: boolean
  cacheStatus: CacheStatus | null
  orgEmployeesCount: number
}

interface EnrichmentPreview {
  companies: CompanyPreview[]
  totals: {
    totalCompanies: number
    companiesWithDomains: number
    companiesWithoutDomains: number
    companiesInCache: number
    companiesNeedingFetch: number
    estimatedEmployeesInCache: number
  }
  creditsRemaining: number
}

interface EnrichmentFilters {
  titles?: string[]
  seniorities?: string[]
}

interface EnrichResult {
  companyId: string
  companyName: string
  employeesFound: number
  employeesCreated: number
  cacheHit: boolean
  error?: string
}

interface EnrichmentResponse {
  success: boolean
  companiesProcessed: number
  companiesSkipped: number
  totalEmployeesFound: number
  totalEmployeesCreated: number
  totalCreditsUsed: number
  cacheHits: number
  apolloFetches: number
  results: EnrichResult[]
  errors?: string[]
  skippedCompanies?: Array<{ id: string; name: string; reason: string }>
}

// New interface for filtered preview results
interface FilteredCompanyPreview {
  companyId: string
  companyName: string
  domain: string | null
  hasDomain: boolean
  totalEmployeesInCache: number
  matchingEmployees: number
  alreadyInOrg: number
  newEmployeesToAdd: number
  cacheHit: boolean
  error?: string
}

interface FilteredPreviewResponse {
  companies: FilteredCompanyPreview[]
  totals: {
    totalCompanies: number
    companiesWithDomains: number
    companiesWithoutDomains: number
    companiesWithMatches: number
    companiesWithoutMatches: number
    totalMatchingEmployees: number
    totalNewEmployees: number
    totalCreditsRequired: number
  }
  creditsRemaining: number
  hasEnoughCredits: boolean
  filters?: EnrichmentFilters
  fetchAll?: boolean
}

export function useLeadsEnrichment() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isEnriching, setIsEnriching] = useState(false)
  const [preview, setPreview] = useState<EnrichmentPreview | null>(null)
  const [filteredPreview, setFilteredPreview] = useState<FilteredPreviewResponse | null>(null)
  const [lastResult, setLastResult] = useState<EnrichmentResponse | null>(null)

  // Get basic enrichment preview for selected companies (cache status only)
  const getPreview = useCallback(async (companyIds?: string[]): Promise<EnrichmentPreview | null> => {
    setIsLoading(true)
    try {
      const params = companyIds?.length ? `?companyIds=${companyIds.join(',')}` : ''
      const response = await fetch(`/api/leads/companies/enrich${params}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to get enrichment preview')
      }

      const data: EnrichmentPreview = await response.json()
      setPreview(data)
      return data
    } catch (error) {
      console.error('Error getting enrichment preview:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to get enrichment preview')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Calculate filtered preview - fetches from Apollo if needed and applies filters
  const calculateFilteredPreview = useCallback(async (params: {
    companyIds?: string[]
    filters?: EnrichmentFilters
    fetchAll?: boolean
  }): Promise<FilteredPreviewResponse | null> => {
    setIsCalculating(true)
    try {
      const response = await fetch('/api/leads/companies/enrich/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to calculate preview')
      }

      const data: FilteredPreviewResponse = await response.json()
      setFilteredPreview(data)
      return data
    } catch (error) {
      console.error('Error calculating preview:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to calculate preview')
      return null
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Execute enrichment
  const enrichCompanies = useCallback(async (params: {
    companyIds?: string[]
    filters?: EnrichmentFilters
    fetchAll?: boolean
  }): Promise<EnrichmentResponse | null> => {
    setIsEnriching(true)
    try {
      const response = await fetch('/api/leads/companies/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to enrich companies')
      }

      const data: EnrichmentResponse = await response.json()
      setLastResult(data)

      // Show success toast
      if (data.success) {
        toast.success(
          `Enriched ${data.companiesProcessed} companies: ${data.totalEmployeesCreated} employees added`,
          {
            description: data.cacheHits > 0
              ? `${data.cacheHits} from cache, ${data.apolloFetches} from Apollo`
              : undefined,
          }
        )
      }

      return data
    } catch (error) {
      console.error('Error enriching companies:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to enrich companies')
      return null
    } finally {
      setIsEnriching(false)
    }
  }, [])

  // Enrich a single company
  const enrichSingleCompany = useCallback(async (
    companyId: string,
    filters?: EnrichmentFilters,
    fetchAll?: boolean
  ): Promise<EnrichmentResponse | null> => {
    return enrichCompanies({
      companyIds: [companyId],
      filters,
      fetchAll,
    })
  }, [enrichCompanies])

  // Clear all previews
  const clearPreview = useCallback(() => {
    setPreview(null)
    setFilteredPreview(null)
    setLastResult(null)
  }, [])

  // Clear just the filtered preview (when filters change)
  const clearFilteredPreview = useCallback(() => {
    setFilteredPreview(null)
  }, [])

  return {
    isLoading,
    isCalculating,
    isEnriching,
    preview,
    filteredPreview,
    lastResult,
    getPreview,
    calculateFilteredPreview,
    enrichCompanies,
    enrichSingleCompany,
    clearPreview,
    clearFilteredPreview,
  }
}

// Export types for use in other components
export type {
  EnrichmentFilters,
  FilteredPreviewResponse,
  FilteredCompanyPreview,
  EnrichmentPreview,
  EnrichmentResponse
}
