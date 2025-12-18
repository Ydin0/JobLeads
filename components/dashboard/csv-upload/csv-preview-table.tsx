'use client'

import { cn } from '@/lib/utils'
import { Building2, Users, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import type { PreviewResponse } from '@/app/api/csv-upload/preview/route'

interface CSVPreviewTableProps {
  previewData: PreviewResponse
}

export function CSVPreviewTable({ previewData }: CSVPreviewTableProps) {
  const { preview, deduplication, errors, warnings, validRows, totalRows } = previewData

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
          value={errors.length + warnings.length}
          subLabel={`${errors.length} errors`}
          variant={errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.length} Validation Errors
            </span>
          </div>
          <div className="max-h-24 space-y-1 overflow-y-auto">
            {errors.slice(0, 5).map((error, i) => (
              <p key={i} className="text-xs text-red-600/80 dark:text-red-400/80">
                Row {error.row}: {error.message}
              </p>
            ))}
            {errors.length > 5 && (
              <p className="text-xs text-red-600/60 dark:text-red-400/60">
                +{errors.length - 5} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
              {warnings.length} Warnings
            </span>
          </div>
          <div className="max-h-24 space-y-1 overflow-y-auto">
            {warnings.slice(0, 3).map((warning, i) => (
              <p key={i} className="text-xs text-amber-600/80 dark:text-amber-400/80">
                Row {warning.row}: {warning.message}
              </p>
            ))}
            {warnings.length > 3 && (
              <p className="text-xs text-amber-600/60 dark:text-amber-400/60">
                +{warnings.length - 3} more warnings
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
