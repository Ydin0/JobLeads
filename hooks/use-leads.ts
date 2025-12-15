'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Lead } from '@/lib/db/schema'

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  return {
    leads,
    isLoading,
    error,
    fetchLeads,
    updateLead,
    deleteLead,
  }
}
