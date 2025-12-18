'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, PanelLeftClose, PanelLeft, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useProspects, type ProspectFilters, type PersonProspect, type CompanyProspect } from '@/hooks/use-prospects'
import { ProspectsFilters, type FilterOptions } from '@/components/dashboard/prospects/prospects-filters'
import { ProspectsPeopleTable } from '@/components/dashboard/prospects/prospects-people-table'
import { ProspectsCompaniesTable } from '@/components/dashboard/prospects/prospects-companies-table'
import { CompanyDetailDialog } from '@/components/dashboard/company-detail-dialog'
import { fetchFilterOptions } from '@/hooks/use-prospects'

export default function ProspectsPage() {
  const [view, setView] = useState<'people' | 'companies'>('people')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState<ProspectFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    jobTitles: [],
    seniorities: [],
    departments: [],
    industries: [],
    sizes: [],
    companies: [],
  })
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)

  const isFirstRender = useRef(true)

  // Fetch filter options
  useEffect(() => {
    fetchFilterOptions().then(setFilterOptions)
  }, [])

  // Debounce search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timeout = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  // Reset page when view or filters change
  useEffect(() => {
    setPage(1)
  }, [view, filters])

  const {
    data,
    isLoading,
    pagination,
    promoteToLeads,
  } = useProspects({
    view,
    page,
    limit: 50,
    search: debouncedSearch,
    filters,
  })

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleFiltersChange = useCallback((newFilters: ProspectFilters) => {
    setFilters(newFilters)
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
    setSearch('')
    setDebouncedSearch('')
  }, [])

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length

  return (
    <div className="flex h-full">
      {/* Sidebar Filters */}
      {showFilters && (
        <div className="w-64 shrink-0 border-r border-black/5 bg-white dark:border-white/5 dark:bg-[#0a0a0f]">
          <div className="flex h-full flex-col">
            {/* Filter Header */}
            <div className="flex items-center justify-between border-b border-black/5 px-3 py-2.5 dark:border-white/5">
              <span className="text-sm font-medium text-black dark:text-white">Filters</span>
              <div className="flex items-center gap-1">
                {activeFilterCount > 0 && (
                  <span className="rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {activeFilterCount}
                  </span>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="rounded p-1 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ProspectsFilters
                filters={filters}
                onChange={handleFiltersChange}
                view={view}
                options={filterOptions}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col bg-white dark:bg-[#0a0a0f]">
        {/* Header */}
        <div className="border-b border-black/5 px-4 py-3 dark:border-white/5">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-black dark:text-white">
              {view === 'people' ? 'People' : 'Companies'}
            </h1>
            <div className="text-sm text-black/40 dark:text-white/40">
              {pagination.totalCount.toLocaleString()} {view === 'people' ? 'people' : 'companies'}
            </div>
          </div>

          {/* Toolbar */}
          <div className="mt-3 flex items-center gap-2">
            {/* View Tabs */}
            <div className="flex rounded-md border border-black/10 dark:border-white/10">
              <button
                onClick={() => setView('people')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  view === 'people'
                    ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white'
                    : 'text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white'
                )}
              >
                People
              </button>
              <button
                onClick={() => setView('companies')}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors border-l border-black/10 dark:border-white/10',
                  view === 'companies'
                    ? 'bg-black/5 text-black dark:bg-white/10 dark:text-white'
                    : 'text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white'
                )}
              >
                Companies
              </button>
            </div>

            {/* Show Filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                showFilters || activeFilterCount > 0
                  ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  : 'border-black/10 text-black/60 hover:bg-black/5 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5'
              )}
            >
              <SlidersHorizontal className="size-3.5" />
              Show Filters
              {activeFilterCount > 0 && (
                <span className="rounded bg-purple-500 px-1 py-0.5 text-[10px] font-medium text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-black/30 dark:text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-8 w-full rounded-md border border-black/10 bg-transparent pl-8 pr-8 text-sm text-black placeholder:text-black/40 focus:border-black/20 focus:outline-none dark:border-white/10 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/20"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('')
                    setDebouncedSearch('')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-black/40 hover:text-black/60 dark:text-white/40 dark:hover:text-white/60"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {view === 'people' ? (
            <ProspectsPeopleTable
              data={data as PersonProspect[]}
              pagination={pagination}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onPromoteToLeads={promoteToLeads}
            />
          ) : (
            <ProspectsCompaniesTable
              data={data as CompanyProspect[]}
              pagination={pagination}
              isLoading={isLoading}
              onPageChange={handlePageChange}
              onCompanyClick={setSelectedCompanyId}
            />
          )}
        </div>
      </div>

      {/* Company Detail Dialog */}
      <CompanyDetailDialog
        companyId={selectedCompanyId}
        onClose={() => setSelectedCompanyId(null)}
      />
    </div>
  )
}
