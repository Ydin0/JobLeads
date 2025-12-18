'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Check,
  Linkedin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Circle,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CompanyProspect, PaginationInfo } from '@/hooks/use-prospects'

interface ProspectsCompaniesTableProps {
  data: CompanyProspect[]
  pagination: PaginationInfo
  isLoading: boolean
  onPageChange: (page: number) => void
  onCompanyClick?: (companyId: string) => void
  onEnrichClick?: (companyIds: string[]) => void
}

const departmentColors: Record<string, string> = {
  engineering: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
  sales: 'bg-green-500/10 text-green-400 ring-green-500/20',
  marketing: 'bg-purple-500/10 text-purple-400 ring-purple-500/20',
  hr: 'bg-pink-500/10 text-pink-400 ring-pink-500/20',
  product: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
  design: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
  finance: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20',
  operations: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
}

export function ProspectsCompaniesTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onCompanyClick,
  onEnrichClick,
}: ProspectsCompaniesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const allSelected = data.length > 0 && selectedIds.length === data.length

  const toggleSelectCompany = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(data.map((c) => c.id))
    }
  }

  const handleBulkEnrich = () => {
    const notEnrichedIds = selectedIds.filter((id) => {
      const company = data.find((c) => c.id === id)
      return company && !company.isEnriched
    })
    if (notEnrichedIds.length > 0 && onEnrichClick) {
      onEnrichClick(notEnrichedIds)
      setSelectedIds([])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-black/40 dark:text-white/40" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] py-16 text-center dark:border-white/5 dark:bg-white/[0.02]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
        <div className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
          <Building2 className="size-4 text-black/30 dark:text-white/30" />
        </div>
        <h3 className="mt-3 text-sm font-medium text-black dark:text-white">No companies found</h3>
        <p className="mt-1 max-w-sm text-xs text-black/40 dark:text-white/40">
          Try adjusting your search or filter criteria
        </p>
      </div>
    )
  }

  const notEnrichedSelectedCount = selectedIds.filter((id) => {
    const company = data.find((c) => c.id === id)
    return company && !company.isEnriched
  }).length

  return (
    <div className="space-y-3">
      {/* Selection actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-purple-500/10 px-3 py-2">
          <span className="text-sm text-purple-400">{selectedIds.length} selected</span>
          {notEnrichedSelectedCount > 0 && onEnrichClick && (
            <Button
              onClick={handleBulkEnrich}
              size="sm"
              className="h-7 bg-purple-500 text-xs text-white hover:bg-purple-600"
            >
              <Sparkles className="mr-1.5 size-3" />
              Enrich {notEnrichedSelectedCount}
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="relative overflow-hidden rounded-xl border border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                <th className="w-10 px-3 py-2.5 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className={cn(
                      'flex size-4 items-center justify-center rounded border transition-all',
                      allSelected
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                    )}
                  >
                    {allSelected && <Check className="size-2.5 text-white" />}
                  </button>
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                  Company
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                  Hiring
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                  Departments
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                  Tech Stack
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                  Contacts
                </th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-black/40 dark:text-white/40">
                  Status
                </th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-black/40 dark:text-white/40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {data.map((company) => {
                const signals = company.hiringSignals
                const totalJobs = signals?.totalJobs || 0
                const recentJobs = signals?.recentJobs || 0
                const departments = signals?.departmentBreakdown || {}
                const topTech = signals?.topTech || []

                // Get top 3 departments
                const topDepts = Object.entries(departments)
                  .filter(([dept]) => dept !== 'other')
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)

                return (
                  <tr
                    key={company.id}
                    onClick={() => onCompanyClick?.(company.id)}
                    className={cn(
                      'group cursor-pointer transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
                      selectedIds.includes(company.id) && 'bg-purple-500/5'
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelectCompany(company.id)
                        }}
                        className={cn(
                          'flex size-4 items-center justify-center rounded border transition-all',
                          selectedIds.includes(company.id)
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                        )}
                      >
                        {selectedIds.includes(company.id) && (
                          <Check className="size-2.5 text-white" />
                        )}
                      </button>
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={company.name || 'Company'}
                            className="size-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-black/10 to-black/5 text-xs font-bold text-black ring-1 ring-inset ring-black/10 dark:from-white/10 dark:to-white/5 dark:text-white dark:ring-white/10">
                            {company.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-black dark:text-white">
                            {company.name || 'Unknown Company'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-black/30 dark:text-white/30">
                              {company.industry || 'Unknown'}
                            </span>
                            {company.size && (
                              <span className="text-xs text-black/20 dark:text-white/20">
                                {company.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Hiring column */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'rounded-md px-2 py-0.5 text-xs font-semibold',
                              recentJobs > 0
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-black/5 text-black/30 dark:bg-white/5 dark:text-white/30'
                            )}
                          >
                            {totalJobs}
                          </span>
                          <span className="text-[10px] text-black/30 dark:text-white/30">jobs</span>
                        </div>
                        {recentJobs > 0 && (
                          <span className="flex items-center gap-0.5 text-[10px] text-green-400">
                            <TrendingUp className="size-2.5" />
                            {recentJobs} new
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Departments column */}
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {topDepts.length > 0 ? (
                          topDepts.map(([dept, count]) => (
                            <span
                              key={dept}
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset',
                                departmentColors[dept] ||
                                  'bg-gray-500/10 text-gray-400 ring-gray-500/20'
                              )}
                            >
                              {dept.charAt(0).toUpperCase() + dept.slice(1).replace('_', ' ')} (
                              {count})
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-black/30 dark:text-white/30">—</span>
                        )}
                      </div>
                    </td>

                    {/* Tech Stack column */}
                    <td className="px-3 py-2.5">
                      <div className="flex max-w-[150px] flex-wrap gap-1">
                        {topTech.length > 0 ? (
                          <>
                            {topTech.slice(0, 3).map((tech) => (
                              <span
                                key={tech}
                                className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-black/60 dark:bg-white/5 dark:text-white/60"
                              >
                                {tech}
                              </span>
                            ))}
                            {topTech.length > 3 && (
                              <span className="text-[10px] text-black/30 dark:text-white/30">
                                +{topTech.length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-black/30 dark:text-white/30">—</span>
                        )}
                      </div>
                    </td>

                    {/* Contacts column */}
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs font-semibold',
                            company.employeesCount > 0
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-black/5 text-black/30 dark:bg-white/5 dark:text-white/30'
                          )}
                        >
                          {company.employeesCount || 0}
                        </span>
                        <span className="text-[10px] text-black/30 dark:text-white/30">people</span>
                      </div>
                    </td>

                    <td className="px-3 py-2.5">
                      {company.isEnriched ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                          <CheckCircle2 className="size-2.5" />
                          Enriched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-medium text-black/40 ring-1 ring-inset ring-black/10 dark:bg-white/5 dark:text-white/40 dark:ring-white/10">
                          <Circle className="size-2.5" />
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {company.linkedinUrl && (
                          <a
                            href={company.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Linkedin className="size-3.5" />
                          </a>
                        )}
                        {company.websiteUrl && (
                          <a
                            href={company.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-black/30 transition-colors hover:bg-black/10 hover:text-black dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        {!company.isEnriched && onEnrichClick && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEnrichClick([company.id])
                            }}
                            className="h-7 w-[72px] bg-gradient-to-r from-purple-500 to-blue-500 text-[10px] text-white hover:from-purple-600 hover:to-blue-600"
                          >
                            <Sparkles className="mr-1 size-2.5" />
                            Enrich
                          </Button>
                        )}
                        {company.isEnriched && company.employeesCount > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              onCompanyClick?.(company.id)
                            }}
                            className="h-7 w-[72px] text-[10px] text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                          >
                            <Users className="mr-1 size-2.5" />
                            View
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-black/5 bg-black/[0.01] px-4 py-2 dark:border-white/5 dark:bg-white/[0.01]">
            <div className="text-xs text-black/40 dark:text-white/40">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
              {pagination.totalCount}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-7 w-7 p-0 text-black/40 hover:bg-black/10 hover:text-black disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 text-xs text-black/60 dark:text-white/60">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="h-7 w-7 p-0 text-black/40 hover:bg-black/10 hover:text-black disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
