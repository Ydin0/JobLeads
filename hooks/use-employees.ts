'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Employee, Company } from '@/lib/db/schema'
import { onDataRefresh } from '@/lib/events'

export interface EmployeeWithCompany extends Employee {
  company: Pick<Company, 'id' | 'name' | 'logoUrl' | 'industry'> | null
}

export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
}

export interface EmployeeFilters {
  companyId?: string
  seniority?: string
  jobTitle?: string
  location?: string
  search?: string
}

export function useEmployees(initialFilters: EmployeeFilters = {}, initialPage = 1, initialLimit = 50) {
  const [employees, setEmployees] = useState<EmployeeWithCompany[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(initialPage)
  const [limit] = useState(initialLimit)
  const [filters, setFilters] = useState<EmployeeFilters>(initialFilters)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: initialLimit,
    totalCount: 0,
    totalPages: 0,
  })

  const fetchEmployees = useCallback(async (pageNum = page, currentFilters = filters) => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      params.set('page', pageNum.toString())
      params.set('limit', limit.toString())

      if (currentFilters.companyId) params.set('companyId', currentFilters.companyId)
      if (currentFilters.seniority) params.set('seniority', currentFilters.seniority)
      if (currentFilters.jobTitle) params.set('jobTitle', currentFilters.jobTitle)
      if (currentFilters.location) params.set('location', currentFilters.location)
      if (currentFilters.search) params.set('search', currentFilters.search)

      const response = await fetch(`/api/employees?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch employees')

      const data = await response.json()
      setEmployees(data.employees)
      setPagination(data.pagination)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [page, limit, filters])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  // Listen for data refresh events
  useEffect(() => {
    const unsubscribe = onDataRefresh(() => {
      fetchEmployees()
    })
    return () => unsubscribe()
  }, [fetchEmployees])

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage)
    fetchEmployees(newPage, filters)
  }, [fetchEmployees, filters])

  const updateFilters = useCallback((newFilters: Partial<EmployeeFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    setPage(1) // Reset to first page when filters change
    fetchEmployees(1, updatedFilters)
  }, [filters, fetchEmployees])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPage(1)
    fetchEmployees(1, {})
  }, [fetchEmployees])

  const promoteToLeads = async (employeeIds: string[]) => {
    const response = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIds }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to promote employees to leads')
    }
    const result = await response.json()

    // Update local state to mark employees as shortlisted
    setEmployees(prev => prev.map(e =>
      employeeIds.includes(e.id) ? { ...e, isShortlisted: true } : e
    ))

    return result
  }

  return {
    employees,
    isLoading,
    error,
    pagination,
    page,
    filters,
    goToPage,
    updateFilters,
    clearFilters,
    fetchEmployees,
    promoteToLeads,
  }
}
