'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Lead } from '@/lib/db/schema'
import { onSearchCompleted, onDataRefresh } from '@/lib/events'

export interface LeadsPagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

interface UseLeadsOptions {
  searchId?: string
  page?: number
  limit?: number
}

export function useLeads(options: UseLeadsOptions = {}) {
  const { searchId, page: initialPage = 1, limit: initialLimit = 50 } = options
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [pagination, setPagination] = useState<LeadsPagination>({
    page: 1,
    limit: initialLimit,
    totalCount: 0,
    totalPages: 0,
  })
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollCountRef = useRef(0) // Track poll attempts to limit infinite polling
  const MAX_POLL_ATTEMPTS = 30 // Stop polling after 5 minutes (30 * 10s)

  const fetchLeads = useCallback(async (pageNum = page) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: initialLimit.toString(),
      })
      if (searchId) {
        params.set('searchId', searchId)
      }
      const response = await fetch(`/api/leads?${params}`)
      if (!response.ok) throw new Error('Failed to fetch leads')
      const data = await response.json()
      setLeads(data.leads)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [page, initialLimit, searchId])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Listen for search completed events and refresh data
  useEffect(() => {
    const unsubscribeSearch = onSearchCompleted(() => {
      fetchLeads()
    })
    const unsubscribeRefresh = onDataRefresh(() => {
      fetchLeads()
    })
    return () => {
      unsubscribeSearch()
      unsubscribeRefresh()
    }
  }, [fetchLeads])

  // Auto-refresh when there are leads with pending phone numbers (with timeout)
  useEffect(() => {
    const hasPendingPhones = leads.some(lead => {
      const metadata = lead.metadata as Record<string, unknown> | null
      return metadata?.phonePending === true
    })

    if (hasPendingPhones && pollCountRef.current < MAX_POLL_ATTEMPTS) {
      // Poll every 10 seconds when phone numbers are pending (max 5 minutes)
      pollIntervalRef.current = setInterval(() => {
        pollCountRef.current += 1
        if (pollCountRef.current >= MAX_POLL_ATTEMPTS) {
          // Stop polling after max attempts
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
          console.log('[useLeads] Stopped polling for pending phones after max attempts')
          return
        }
        fetchLeads()
      }, 10000)
    } else {
      // Clear polling when no pending phones
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
      // Reset poll count when no pending phones
      if (!hasPendingPhones) {
        pollCountRef.current = 0
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [leads, fetchLeads])

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
    fetchLeads(newPage)
  }, [fetchLeads])

  const updateLead = async (id: string, data: Partial<Lead>) => {
    const response = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update lead')
    const updated = await response.json()
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
    return updated
  }

  const deleteLead = async (id: string) => {
    const response = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete lead')
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  const enrichLead = async (id: string) => {
    const response = await fetch(`/api/leads/${id}/enrich`, {
      method: 'POST',
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to enrich lead')
    }
    const result = await response.json()
    setLeads(prev => prev.map(l => l.id === id ? result.lead : l))
    return result
  }

  const bulkEnrichLeads = async (leadIds: string[], revealPhoneNumber: boolean = false) => {
    const response = await fetch('/api/leads/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, revealPhoneNumber }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to bulk enrich leads')
    }
    const result = await response.json()
    // Refresh leads to get updated data
    await fetchLeads()
    return result
  }

  return {
    leads,
    isLoading,
    error,
    pagination,
    page,
    goToPage,
    fetchLeads,
    updateLead,
    deleteLead,
    enrichLead,
    bulkEnrichLeads,
  }
}
