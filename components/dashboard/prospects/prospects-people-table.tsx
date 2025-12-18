'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Check,
  Linkedin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  Copy,
  Users,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { PersonProspect, PaginationInfo } from '@/hooks/use-prospects'

interface ProspectsPeopleTableProps {
  data: PersonProspect[]
  pagination: PaginationInfo
  isLoading: boolean
  onPageChange: (page: number) => void
  onPromoteToLeads: (ids: string[]) => Promise<{ success: boolean; count: number }>
}

export function ProspectsPeopleTable({
  data,
  pagination,
  isLoading,
  onPageChange,
  onPromoteToLeads,
}: ProspectsPeopleTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPromoting, setIsPromoting] = useState(false)

  const availablePeople = data.filter((p) => !p.isShortlisted)
  const allAvailableSelected =
    availablePeople.length > 0 && selectedIds.length === availablePeople.length

  const toggleSelectPerson = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (allAvailableSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(availablePeople.map((p) => p.id))
    }
  }

  const handlePromoteToLeads = async () => {
    if (selectedIds.length === 0) return

    setIsPromoting(true)
    try {
      const result = await onPromoteToLeads(selectedIds)
      if (result.success) {
        toast.success(`Added ${result.count} people to leads`)
        setSelectedIds([])
      } else {
        toast.error('Failed to add to leads')
      }
    } catch {
      toast.error('Failed to add to leads')
    } finally {
      setIsPromoting(false)
    }
  }

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    toast.success('Email copied')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-5 animate-spin text-black/30 dark:text-white/30" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="size-8 text-black/20 dark:text-white/20" />
        <p className="mt-2 text-sm text-black/40 dark:text-white/40">No people found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Selection bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 border-b border-black/5 bg-purple-50 px-4 py-2 dark:border-white/5 dark:bg-purple-500/10">
          <span className="text-sm text-purple-600 dark:text-purple-400">
            {selectedIds.length} selected
          </span>
          <Button
            onClick={handlePromoteToLeads}
            disabled={isPromoting}
            size="sm"
            className="h-7 bg-purple-500 text-xs text-white hover:bg-purple-600"
          >
            {isPromoting ? (
              <Loader2 className="mr-1.5 size-3 animate-spin" />
            ) : (
              <UserPlus className="mr-1.5 size-3" />
            )}
            Add to Leads
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white dark:bg-[#0a0a0f]">
            <tr className="border-b border-black/5 dark:border-white/5">
              <th className="w-10 px-4 py-2.5 text-left">
                <button
                  onClick={toggleSelectAll}
                  className={cn(
                    'flex size-4 items-center justify-center rounded border transition-all',
                    allAvailableSelected
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                  )}
                >
                  {allAvailableSelected && <Check className="size-2.5 text-white" />}
                </button>
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-black/50 dark:text-white/50">
                Name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-black/50 dark:text-white/50">
                Job title
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-black/50 dark:text-white/50">
                Company
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-black/50 dark:text-white/50">
                Emails
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-black/50 dark:text-white/50">
                Phone numbers
              </th>
              <th className="w-10 px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((person) => (
              <tr
                key={person.id}
                className={cn(
                  'group border-b border-black/5 transition-colors hover:bg-black/[0.02] dark:border-white/5 dark:hover:bg-white/[0.02]',
                  selectedIds.includes(person.id) && 'bg-purple-50/50 dark:bg-purple-500/5'
                )}
              >
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => toggleSelectPerson(person.id)}
                    className={cn(
                      'flex size-4 items-center justify-center rounded border transition-all',
                      selectedIds.includes(person.id)
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40'
                    )}
                  >
                    {selectedIds.includes(person.id) && (
                      <Check className="size-2.5 text-white" />
                    )}
                  </button>
                </td>

                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black dark:text-white">
                      {person.firstName} {person.lastName}
                    </span>
                    {person.linkedinUrl && (
                      <a
                        href={person.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-black/30 hover:text-blue-500 dark:text-white/30"
                      >
                        <Linkedin className="size-3.5" />
                      </a>
                    )}
                  </div>
                </td>

                <td className="px-4 py-2.5">
                  <span className="text-sm text-black/70 dark:text-white/70">
                    {person.jobTitle || '—'}
                  </span>
                </td>

                <td className="px-4 py-2.5">
                  {person.company ? (
                    <div className="flex items-center gap-2">
                      {person.company.logoUrl ? (
                        <img
                          src={person.company.logoUrl}
                          alt=""
                          className="size-5 rounded object-cover"
                        />
                      ) : (
                        <div className="flex size-5 items-center justify-center rounded bg-black/5 text-[10px] font-medium text-black/50 dark:bg-white/5 dark:text-white/50">
                          {person.company.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm text-black/70 dark:text-white/70">
                        {person.company.name}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-black/30 dark:text-white/30">—</span>
                  )}
                </td>

                <td className="px-4 py-2.5">
                  {person.email ? (
                    <button
                      onClick={() => copyEmail(person.email!)}
                      className="group/email flex items-center gap-1.5 rounded-md border border-black/10 px-2 py-1 text-xs text-black/70 transition-colors hover:border-black/20 hover:bg-black/5 dark:border-white/10 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/5"
                    >
                      <Mail className="size-3 text-green-500" />
                      <span className="max-w-[140px] truncate">{person.email}</span>
                      <Copy className="size-3 opacity-0 transition-opacity group-hover/email:opacity-100" />
                    </button>
                  ) : (
                    <span className="text-xs text-black/30 dark:text-white/30">—</span>
                  )}
                </td>

                <td className="px-4 py-2.5">
                  {person.phone ? (
                    <div className="flex items-center gap-1.5 text-xs text-black/70 dark:text-white/70">
                      <Phone className="size-3 text-blue-500" />
                      {person.phone}
                    </div>
                  ) : (
                    <span className="text-xs text-black/30 dark:text-white/30">—</span>
                  )}
                </td>

                <td className="px-4 py-2.5">
                  {person.isShortlisted && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-600 dark:bg-green-500/20 dark:text-green-400">
                      Lead
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-black/5 px-4 py-2 dark:border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex size-7 items-center justify-center rounded border border-black/10 text-black/50 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-xs text-black/50 dark:text-white/50">
              {pagination.page}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="flex size-7 items-center justify-center rounded border border-black/10 text-black/50 transition-colors hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/5"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          <span className="text-xs text-black/40 dark:text-white/40">
            {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
}
