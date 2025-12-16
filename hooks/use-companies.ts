'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Company } from '@/lib/db/schema'
import { onSearchCompleted, onDataRefresh } from '@/lib/events'

export interface CompanyWithCounts extends Company {
  employeesCount: number
  leadsCount: number
}

export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export function useCompanies(initialPage = 1, initialLimit = 20) {
  const [companies, setCompanies] = useState<CompanyWithCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: initialLimit,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchCompanies = useCallback(async (pageNum = page) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/companies?page=${pageNum}&limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch companies')
      const data = await response.json()
      setCompanies(data.companies)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit])

  useEffect(() => {
    fetchCompanies()
  }, [fetchCompanies])

  // Listen for search completed events and refresh data
  useEffect(() => {
    const unsubscribeSearch = onSearchCompleted(() => {
      fetchCompanies()
    })
    const unsubscribeRefresh = onDataRefresh(() => {
      fetchCompanies()
    })
    return () => {
      unsubscribeSearch()
      unsubscribeRefresh()
    }
  }, [fetchCompanies])

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
    fetchCompanies(newPage)
  }, [fetchCompanies])

  const updateCompany = async (id: string, data: Partial<Company>) => {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update company')
    const updated = await response.json()
    setCompanies(prev => prev.map(c => c.id === id ? { ...updated, leadsCount: c.leadsCount } : c))
    return updated
  }

  const deleteCompany = async (id: string) => {
    const response = await fetch(`/api/companies/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete company')
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  const enrichCompany = async (id: string, options?: { findContacts?: boolean; seniorities?: string[] }) => {
    const response = await fetch(`/api/companies/${id}/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to enrich company')
    }
    const result = await response.json()
    // Update company and increment employeesCount based on employees found
    setCompanies(prev => prev.map(c => c.id === id ? {
      ...result.company,
      employeesCount: (c.employeesCount || 0) + (result.employeesFound || 0),
      leadsCount: c.leadsCount || 0,
    } : c))
    return result
  }

  return {
    companies,
    isLoading,
    error,
    pagination,
    page,
    goToPage,
    fetchCompanies,
    updateCompany,
    deleteCompany,
    enrichCompany,
  }
}
