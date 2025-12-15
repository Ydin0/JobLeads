'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Search } from '@/lib/db/schema'

export function useSearches() {
  const [searches, setSearches] = useState<Search[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSearches = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/searches')
      if (!response.ok) throw new Error('Failed to fetch searches')
      const data = await response.json()
      setSearches(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSearches()
  }, [fetchSearches])

  const createSearch = async (data: {
    name: string
    description?: string
    filters?: {
      jobTitles?: string[]
      locations?: string[]
      companyNames?: string[]
      keywords?: string[]
    }
  }) => {
    const response = await fetch('/api/searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create search')
    const newSearch = await response.json()
    setSearches(prev => [newSearch, ...prev])
    return newSearch
  }

  const runSearch = async (id: string) => {
    const response = await fetch(`/api/searches/${id}/run`, {
      method: 'POST',
    })
    if (!response.ok) throw new Error('Failed to run search')
    const result = await response.json()
    // Refresh searches to get updated count
    await fetchSearches()
    return result
  }

  const updateSearch = async (id: string, data: Partial<Search>) => {
    const response = await fetch(`/api/searches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update search')
    const updated = await response.json()
    setSearches(prev => prev.map(s => s.id === id ? updated : s))
    return updated
  }

  const deleteSearch = async (id: string) => {
    const response = await fetch(`/api/searches/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete search')
    setSearches(prev => prev.filter(s => s.id !== id))
  }

  return {
    searches,
    isLoading,
    error,
    fetchSearches,
    createSearch,
    runSearch,
    updateSearch,
    deleteSearch,
  }
}
