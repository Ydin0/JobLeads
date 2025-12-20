'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DashboardSuggestion } from '@/lib/ai-suggestions'

interface SuggestionsResponse {
  rules: DashboardSuggestion[]
  ai: {
    suggestions: DashboardSuggestion[]
    generatedAt: string | null
    isStale: boolean
    refreshesRemaining: number
  }
  context: {
    companiesTotal: number
    leadsTotal: number
    icpsTotal: number
  }
}

export function useDashboardSuggestions() {
  const [ruleSuggestions, setRuleSuggestions] = useState<DashboardSuggestion[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<DashboardSuggestion[]>([])
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [refreshesRemaining, setRefreshesRemaining] = useState(5)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dashboard/suggestions')

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions')
      }

      const data: SuggestionsResponse = await response.json()

      setRuleSuggestions(data.rules)
      setAiSuggestions(data.ai.suggestions)
      setGeneratedAt(data.ai.generatedAt)
      setIsStale(data.ai.isStale)
      setRefreshesRemaining(data.ai.refreshesRemaining)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshAISuggestions = useCallback(async () => {
    if (refreshesRemaining <= 0) {
      setError('No refreshes remaining today')
      return false
    }

    try {
      setIsRefreshing(true)
      setError(null)

      const response = await fetch('/api/dashboard/suggestions', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 429) {
          setError(data.message || 'Rate limit exceeded')
          setRefreshesRemaining(0)
          return false
        }
        throw new Error(data.error || 'Failed to refresh suggestions')
      }

      const data: SuggestionsResponse = await response.json()

      setRuleSuggestions(data.rules)
      setAiSuggestions(data.ai.suggestions)
      setGeneratedAt(data.ai.generatedAt)
      setIsStale(data.ai.isStale)
      setRefreshesRemaining(data.ai.refreshesRemaining)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return false
    } finally {
      setIsRefreshing(false)
    }
  }, [refreshesRemaining])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  // Combine all suggestions, with rule-based first then AI
  const allSuggestions = [...ruleSuggestions, ...aiSuggestions]

  // Format the generated at time
  const formatGeneratedAt = (dateStr: string | null): string => {
    if (!dateStr) return 'Never'

    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return {
    // All suggestions combined
    suggestions: allSuggestions,

    // Separated by source
    ruleSuggestions,
    aiSuggestions,

    // AI metadata
    generatedAt,
    generatedAtFormatted: formatGeneratedAt(generatedAt),
    isStale,
    refreshesRemaining,

    // Loading states
    isLoading,
    isRefreshing,
    error,

    // Actions
    refresh: fetchSuggestions,
    refreshAI: refreshAISuggestions,
  }
}
