'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Building2, Users, AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { PreviewResponse } from '@/app/api/csv-upload/preview/route'

interface CSVPreviewTableProps {
  previewData: PreviewResponse
}

// Group errors and warnings by row number
function groupByRow(items: Array<{ row: number; field: string; message: string }>) {
  const grouped = new Map<number, Array<{ field: string; message: string }>>()
  for (const item of items) {
    if (!grouped.has(item.row)) {
      grouped.set(item.row, [])
    }
    grouped.get(item.row)!.push({ field: item.field, message: item.message })
  }
  return grouped
}

export function CSVPreviewTable({ previewData }: CSVPreviewTableProps) {
  const { preview, deduplication, errors, warnings, validRows, totalRows } = previewData
  const [showAllErrors, setShowAllErrors] = useState(false)

  // Group errors by row for better display
  const errorsByRow = groupByRow(errors)
  const warningsByRow = groupByRow(warnings)
  const uniqueErrorRows = Array.from(errorsByRow.keys()).sort((a, b) => a - b)
  const uniqueWarningRows = Array.from(warningsByRow.keys()).sort((a, b) => a - b)
  const displayedErrorRows = showAllErrors ? uniqueErrorRows : uniqueErrorRows.slice(0, 5)

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon={Building2}
          label="Companies"
          value={preview.companies.length}
          subLabel={`${deduplication.newCompanies} new`}
        />
        <StatCard
          icon={Users}
          label="Contacts"
          value={preview.contacts.length}
          subLabel={`${deduplication.newContacts} new`}
        />
        <StatCard
          icon={CheckCircle}
          label="Valid Rows"
          value={validRows}
          subLabel={`of ${totalRows}`}
          variant="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="Issues"
          value={uniqueErrorRows.length + uniqueWarningRows.length}
          subLabel={`${uniqueErrorRows.length} rows with errors`}
          variant={errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Errors - Grouped by Row */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 text-red-500" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">
                {uniqueErrorRows.length} Rows with Validation Errors
              </span>
            </div>
            {uniqueErrorRows.length > 5 && (
              <button
                onClick={() => setShowAllErrors(!showAllErrors)}
                className="flex items-center gap-1 text-[10px] text-red-600/70 hover:text-red-600 dark:text-red-400/70 dark:hover:text-red-400"
              >
                {showAllErrors ? (
                  <>
                    Show less <ChevronUp className="size-3" />
                  </>
                ) : (
                  <>
                    Show all ({uniqueErrorRows.length}) <ChevronDown className="size-3" />
                  </>
                )}
              </button>
            )}
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {displayedErrorRows.map((rowNum) => {
              const rowErrors = errorsByRow.get(rowNum) || []
              return (
                <div key={rowNum} className="rounded border border-red-500/10 bg-red-500/5 p-2">
                  <div className="mb-1 text-[10px] font-medium text-red-700 dark:text-red-300">
                    Row {rowNum}
                  </div>
                  <div className="space-y-0.5">
                    {rowErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600/80 dark:text-red-400/80">
                        <span className="font-medium">{err.field}:</span> {err.message}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Warnings - Grouped by Row */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {uniqueWarningRows.length} Rows with Warnings
            </span>
          </div>
          <div className="max-h-32 space-y-2 overflow-y-auto">
            {uniqueWarningRows.slice(0, 3).map((rowNum) => {
              const rowWarnings = warningsByRow.get(rowNum) || []
              return (
                <div key={rowNum} className="rounded border border-amber-500/10 bg-amber-500/5 p-2">
                  <div className="mb-1 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                    Row {rowNum}
                  </div>
                  <div className="space-y-0.5">
                    {rowWarnings.map((warn, i) => (
                      <p key={i} className="text-xs text-amber-600/80 dark:text-amber-400/80">
                        <span className="font-medium">{warn.field}:</span> {warn.message}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}
            {uniqueWarningRows.length > 3 && (
              <p className="text-xs text-amber-600/60 dark:text-amber-400/60">
                +{uniqueWarningRows.length - 3} more rows with warnings
              </p>
            )}
          </div>
        </div>
      )}

      {/* Companies Preview */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Companies Preview
        </h3>
        <div className="rounded-lg border border-black/5 dark:border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                <th className="px-3 py-2 text-left font-medium text-black/60 dark:text-white/60">
                  Company Name
                </th>
                <th className="px-3 py-2 text-left font-medium text-black/60 dark:text-white/60">
                  Domain
                </th>
                <th className="px-3 py-2 text-right font-medium text-black/60 dark:text-white/60">
                  Contacts
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.companies.map((company, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-3 py-2 text-black dark:text-white">{company.name}</td>
                  <td className="px-3 py-2 text-black/60 dark:text-white/60">
                    {company.domain || '-'}
                  </td>
                  <td className="px-3 py-2 text-right text-black/60 dark:text-white/60">
                    {company.contactsCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contacts Preview */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
          Contacts Preview
        </h3>
        <div className="rounded-lg border border-black/5 dark:border-white/5">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                <th className="px-3 py-2 text-left font-medium text-black/60 dark:text-white/60">
                  Name
                </th>
                <th className="px-3 py-2 text-left font-medium text-black/60 dark:text-white/60">
                  Email
                </th>
                <th className="px-3 py-2 text-left font-medium text-black/60 dark:text-white/60">
                  Company
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.contacts.slice(0, 10).map((contact, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-3 py-2 text-black dark:text-white">
                    {contact.firstName} {contact.lastName}
                  </td>
                  <td className="px-3 py-2 text-black/60 dark:text-white/60">
                    {contact.email || '-'}
                  </td>
                  <td className="px-3 py-2 text-black/60 dark:text-white/60">
                    {contact.companyName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.contacts.length > 10 && (
            <div className="border-t border-black/5 px-3 py-2 text-center text-[10px] text-black/40 dark:border-white/5 dark:text-white/40">
              +{preview.contacts.length - 10} more contacts
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  variant = 'default',
}: {
  icon: React.ElementType
  label: string
  value: number
  subLabel: string
  variant?: 'default' | 'success' | 'warning' | 'error'
}) {
  const variantStyles = {
    default: 'text-black/40 dark:text-white/40',
    success: 'text-green-500',
    warning: 'text-amber-500',
    error: 'text-red-500',
  }

  return (
    <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <Icon className={cn('size-3.5', variantStyles[variant])} />
        <span className="text-[10px] text-black/40 dark:text-white/40">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold text-black dark:text-white">{value}</div>
      <div className="text-[10px] text-black/40 dark:text-white/40">{subLabel}</div>
    </div>
  )
}
