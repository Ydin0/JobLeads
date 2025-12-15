'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Company } from '@/lib/db/schema'

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/companies')
      if (!response.ok) throw new Error('Failed to fetch companies')
      const data = await response.json()
      setCompanies(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  const updateCompany = async (id: string, data: Partial<Company>) => {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update company')
    const updated = await response.json()
    setCompanies(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }

  const deleteCompany = async (id: string) => {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete company')
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  return {
    companies,
    isLoading,
    error,
    fetchCompanies,
    updateCompany,
    deleteCompany,
  }
}
