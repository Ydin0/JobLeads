'use client'

import { cn } from '@/lib/utils'
import {
  Building2,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Globe,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { UploadResponse } from '@/app/api/csv-upload/route'

interface CSVUploadResultsProps {
  result: UploadResponse
  onClose: () => void
  onViewCompanies: () => void
  onEnrichWithApollo?: () => void
}

export function CSVUploadResults({
  result,
  onClose,
  onViewCompanies,
  onEnrichWithApollo,
}: CSVUploadResultsProps) {
  const { stats, errors, enrichmentQueued } = result
  const hasErrors = errors.length > 0

  const totalCompanies = stats.companiesCreated + stats.companiesUpdated + stats.companiesSkipped
  const totalContacts = stats.contactsCreated + stats.contactsUpdated + stats.contactsSkipped

  return (
    <div className="space-y-6">
      {/* Success/Warning Banner */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border p-4',
          hasErrors
            ? 'border-amber-500/20 bg-amber-500/5'
            : 'border-green-500/20 bg-green-500/5'
        )}
      >
        {hasErrors ? (
          <AlertCircle className="size-6 text-amber-500" />
        ) : (
          <CheckCircle className="size-6 text-green-500" />
        )}
        <div>
          <h3
            className={cn(
              'text-sm font-medium',
              hasErrors ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
            )}
          >
            {hasErrors ? 'Import Completed with Warnings' : 'Import Successful'}
          </h3>
          <p className="text-xs text-black/60 dark:text-white/60">
            {stats.companiesCreated + stats.contactsCreated} records created
            {stats.companiesUpdated + stats.contactsUpdated > 0 &&
              `, ${stats.companiesUpdated + stats.contactsUpdated} updated`}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Companies Stats */}
        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="size-4 text-[var(--theme-accent)] dark:text-purple-500" />
            <span className="text-xs font-medium text-black dark:text-white">Companies</span>
          </div>
          <div className="space-y-2">
            <StatRow label="Created" value={stats.companiesCreated} variant="success" />
            <StatRow label="Updated" value={stats.companiesUpdated} variant="info" />
            <StatRow label="Skipped" value={stats.companiesSkipped} variant="muted" />
            <div className="border-t border-black/5 pt-2 dark:border-white/5">
              <StatRow label="Total" value={totalCompanies} variant="default" />
            </div>
          </div>
        </div>

        {/* Contacts Stats */}
        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
          <div className="mb-3 flex items-center gap-2">
            <Users className="size-4 text-[var(--theme-accent)] dark:text-purple-500" />
            <span className="text-xs font-medium text-black dark:text-white">Contacts</span>
          </div>
          <div className="space-y-2">
            <StatRow label="Created" value={stats.contactsCreated} variant="success" />
            <StatRow label="Updated" value={stats.contactsUpdated} variant="info" />
            <StatRow label="Skipped" value={stats.contactsSkipped} variant="muted" />
            <div className="border-t border-black/5 pt-2 dark:border-white/5">
              <StatRow label="Total" value={totalContacts} variant="default" />
            </div>
          </div>
        </div>
      </div>

      {/* Global Cache Stats */}
      <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-black/40 dark:text-white/40" />
          <span className="text-xs text-black/60 dark:text-white/60">
            Also stored {stats.globalCompaniesCreated} companies and {stats.globalContactsCreated}{' '}
            contacts to platform database
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle className="size-4 text-red-500" />
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              {errors.length} rows could not be processed
            </span>
          </div>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {errors.slice(0, 10).map((error, i) => (
              <p key={i} className="text-xs text-red-600/80 dark:text-red-400/80">
                Row {error.row}: {error.message}
              </p>
            ))}
            {errors.length > 10 && (
              <p className="text-xs text-red-600/60 dark:text-red-400/60">
                +{errors.length - 10} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Enrichment Status */}
      {enrichmentQueued && (
        <div className="rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 p-3 dark:border-purple-500/20 dark:bg-purple-500/5">
          <div className="flex items-center gap-2">
            <RefreshCw className="size-4 animate-spin text-[var(--theme-accent)] dark:text-purple-500" />
            <span className="text-xs text-[var(--theme-accent)] dark:text-purple-400">
              Apollo enrichment is processing in the background
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        {!enrichmentQueued && onEnrichWithApollo && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEnrichWithApollo}
            className="h-8 gap-1.5 text-xs"
          >
            <Sparkles className="size-3.5" />
            Enrich with Apollo
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
            Close
          </Button>
          <Button
            size="sm"
            onClick={onViewCompanies}
            className="h-8 gap-1.5 bg-[var(--theme-accent)] text-xs text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
          >
            View Companies
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  variant,
}: {
  label: string
  value: number
  variant: 'success' | 'info' | 'muted' | 'default'
}) {
  const variantStyles = {
    success: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    muted: 'text-black/40 dark:text-white/40',
    default: 'text-black dark:text-white font-medium',
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-black/60 dark:text-white/60">{label}</span>
      <span className={cn('text-xs', variantStyles[variant])}>{value}</span>
    </div>
  )
}
