'use client'

import { useState, useEffect } from 'react'
import { X, Zap, Target, AlertCircle, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MemberCredits {
  enrichment: {
    limit: number | null
    used: number
    remaining: number | null
  }
  icp: {
    limit: number | null
    used: number
    remaining: number | null
  }
}

interface MemberLimitsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: {
    userId: string
    user: {
      email: string
      firstName: string | null
      lastName: string | null
    }
    credits: MemberCredits
    isBlocked: boolean
  }
  orgLimits: {
    enrichmentLimit: number
    icpLimit: number
  }
  onSave: (limits: { enrichmentLimit: number | null; icpLimit: number | null; isBlocked: boolean }) => Promise<void>
}

export function MemberLimitsModal({
  open,
  onOpenChange,
  member,
  orgLimits,
  onSave,
}: MemberLimitsModalProps) {
  const [enrichmentUnlimited, setEnrichmentUnlimited] = useState(member.credits.enrichment.limit === null)
  const [icpUnlimited, setIcpUnlimited] = useState(member.credits.icp.limit === null)
  const [enrichmentLimit, setEnrichmentLimit] = useState(member.credits.enrichment.limit ?? orgLimits.enrichmentLimit)
  const [icpLimit, setIcpLimit] = useState(member.credits.icp.limit ?? orgLimits.icpLimit)
  const [isBlocked, setIsBlocked] = useState(member.isBlocked)
  const [isSaving, setIsSaving] = useState(false)

  // Reset state when member changes
  useEffect(() => {
    setEnrichmentUnlimited(member.credits.enrichment.limit === null)
    setIcpUnlimited(member.credits.icp.limit === null)
    setEnrichmentLimit(member.credits.enrichment.limit ?? orgLimits.enrichmentLimit)
    setIcpLimit(member.credits.icp.limit ?? orgLimits.icpLimit)
    setIsBlocked(member.isBlocked)
  }, [member, orgLimits])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        enrichmentLimit: enrichmentUnlimited ? null : enrichmentLimit,
        icpLimit: icpUnlimited ? null : icpLimit,
        isBlocked,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save limits:', error)
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  const memberName = member.user.firstName
    ? `${member.user.firstName} ${member.user.lastName || ''}`.trim()
    : member.user.email

  const enrichmentUsagePercent = enrichmentUnlimited
    ? (member.credits.enrichment.used / orgLimits.enrichmentLimit) * 100
    : enrichmentLimit > 0
      ? (member.credits.enrichment.used / enrichmentLimit) * 100
      : 100

  const icpUsagePercent = icpUnlimited
    ? (member.credits.icp.used / orgLimits.icpLimit) * 100
    : icpLimit > 0
      ? (member.credits.icp.used / icpLimit) * 100
      : 100

  const showEnrichmentWarning = !enrichmentUnlimited && enrichmentLimit < member.credits.enrichment.used
  const showIcpWarning = !icpUnlimited && icpLimit < member.credits.icp.used

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[#0a0a0f]">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-lg font-semibold text-black dark:text-white">
          Set Credit Limits
        </h2>
        <p className="mt-1 text-sm text-black/50 dark:text-white/50">
          Configure spending limits for {memberName}
        </p>

        <div className="mt-6 space-y-6">
          {/* Block Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-lg ${isBlocked ? 'bg-red-100 dark:bg-red-500/20' : 'bg-black/5 dark:bg-white/5'}`}>
                <Ban className={`size-5 ${isBlocked ? 'text-red-600 dark:text-red-400' : 'text-black/40 dark:text-white/40'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-black dark:text-white">Block Spending</p>
                <p className="text-xs text-black/50 dark:text-white/50">
                  Prevent this member from using any credits
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsBlocked(!isBlocked)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                isBlocked ? 'bg-red-500' : 'bg-black/10 dark:bg-white/10'
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                  isBlocked ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Enrichment Credits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-violet-500" />
                <span className="text-sm font-medium text-black dark:text-white">Enrichment Credits</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-xs text-black/50 dark:text-white/50">Unlimited</span>
                <button
                  onClick={() => setEnrichmentUnlimited(!enrichmentUnlimited)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    enrichmentUnlimited ? 'bg-violet-500' : 'bg-black/10 dark:bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                      enrichmentUnlimited ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </label>
            </div>

            {!enrichmentUnlimited && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={orgLimits.enrichmentLimit}
                    value={enrichmentLimit}
                    onChange={(e) => setEnrichmentLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-9 w-24 rounded-lg border border-black/10 bg-white px-3 text-sm text-black dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <span className="text-xs text-black/40 dark:text-white/40">
                    / {orgLimits.enrichmentLimit} org limit
                  </span>
                </div>
                {showEnrichmentWarning && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3.5" />
                    Limit is below current usage ({member.credits.enrichment.used})
                  </div>
                )}
              </div>
            )}

            {/* Usage bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                <span>Used: {member.credits.enrichment.used}</span>
                <span>
                  {enrichmentUnlimited
                    ? `Org limit: ${orgLimits.enrichmentLimit}`
                    : `Limit: ${enrichmentLimit}`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min(100, enrichmentUsagePercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* ICP Credits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-violet-500" />
                <span className="text-sm font-medium text-black dark:text-white">ICP Credits</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-xs text-black/50 dark:text-white/50">Unlimited</span>
                <button
                  onClick={() => setIcpUnlimited(!icpUnlimited)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    icpUnlimited ? 'bg-violet-500' : 'bg-black/10 dark:bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
                      icpUnlimited ? 'translate-x-4' : ''
                    }`}
                  />
                </button>
              </label>
            </div>

            {!icpUnlimited && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max={orgLimits.icpLimit}
                    value={icpLimit}
                    onChange={(e) => setIcpLimit(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-9 w-24 rounded-lg border border-black/10 bg-white px-3 text-sm text-black dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                  <span className="text-xs text-black/40 dark:text-white/40">
                    / {orgLimits.icpLimit.toLocaleString()} org limit
                  </span>
                </div>
                {showIcpWarning && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <AlertCircle className="size-3.5" />
                    Limit is below current usage ({member.credits.icp.used})
                  </div>
                )}
              </div>
            )}

            {/* Usage bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-black/50 dark:text-white/50">
                <span>Used: {member.credits.icp.used}</span>
                <span>
                  {icpUnlimited
                    ? `Org limit: ${orgLimits.icpLimit.toLocaleString()}`
                    : `Limit: ${icpLimit.toLocaleString()}`}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/5">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all"
                  style={{ width: `${Math.min(100, icpUsagePercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {isSaving ? 'Saving...' : 'Save Limits'}
          </Button>
        </div>
      </div>
    </div>
  )
}
