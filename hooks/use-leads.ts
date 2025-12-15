'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Lead } from '@/lib/db/schema'
import { onSearchCompleted, onDataRefresh } from '@/lib/events'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/leads')
      if (!response.ok) throw new Error('Failed to fetch leads')
      const data = await response.json()
      setLeads(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

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

  // Auto-refresh when there are leads with pending phone numbers
  useEffect(() => {
    const hasPendingPhones = leads.some(lead => {
      const metadata = lead.metadata as Record<string, unknown> | null
      return metadata?.phonePending === true
    })

    if (hasPendingPhones) {
      // Poll every 10 seconds when phone numbers are pending
      pollIntervalRef.current = setInterval(() => {
        fetchLeads()
      }, 10000)
    } else {
      // Clear polling when no pending phones
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [leads, fetchLeads])

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
    fetchLeads,
    updateLead,
    deleteLead,
    enrichLead,
    bulkEnrichLeads,
  }
}
