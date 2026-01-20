'use client'

import { useState, useEffect, useCallback } from 'react'
import { onSearchCompleted, onDataRefresh } from '@/lib/events'

export interface DashboardStats {
  counts: {
    leads: number
    companies: number
    searches: number
  }
  recentActivity: {
    leads: Array<{
      id: string
      firstName: string
      lastName: string
      createdAt: string
    }>
    searches: Array<{
      id: string
      name: string
      lastRunAt: string | null
      resultsCount: number | null
    }>
    enrichedCompanies: Array<{
      id: string
      name: string
      enrichedAt: string | null
      isEnriched: boolean | null
    }>
  }
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')
      const data = await response.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Listen for search completed events and refresh data
  useEffect(() => {
    const unsubscribeSearch = onSearchCompleted(() => {
      fetchStats()
    })
    const unsubscribeRefresh = onDataRefresh(() => {
      fetchStats()
    })
    return () => {
      unsubscribeSearch()
      unsubscribeRefresh()
    }
  }, [fetchStats])

  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
  }
}
