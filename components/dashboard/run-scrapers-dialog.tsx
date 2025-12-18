'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  X,
  Play,
  AlertTriangle,
  Loader2,
  Briefcase,
  MapPin,
  GraduationCap,
} from 'lucide-react'

interface ScraperConfig {
  jobTitle: string
  location: string
  experienceLevel: string
}

interface RunScrapersDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  scrapers: ScraperConfig[]
  isRunning: boolean
}

const experienceLevelLabels: Record<string, string> = {
  any: 'Any Level',
  entry: 'Entry Level',
  mid: 'Mid Level',
  senior: 'Senior',
  lead: 'Lead / Principal',
  executive: 'Executive',
}

export function RunScrapersDialog({
  isOpen,
  onClose,
  onConfirm,
  scrapers,
  isRunning,
}: RunScrapersDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsConfirming(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
              <Play className="size-4 text-black dark:text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">
                Run All Scrapers
              </h2>
              <p className="text-xs text-black/50 dark:text-white/50">
                {scrapers.length} scraper{scrapers.length !== 1 ? 's' : ''} ready to run
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConfirming}
            className="rounded-full p-2 text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Warning Banner */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Running scrapers will consume credits
              </p>
              <p className="mt-0.5 text-[11px] text-amber-600/80 dark:text-amber-400/70">
                Each scraper run uses API credits. Running {scrapers.length} scraper{scrapers.length !== 1 ? 's' : ''} will process them sequentially.
              </p>
            </div>
          </div>

          {/* Scrapers List */}
          <div>
            <h3 className="mb-2 text-xs font-medium text-black/60 dark:text-white/60">
              Scrapers to run
            </h3>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {scrapers.map((scraper, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]"
                >
                  <div className="flex size-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                    <Briefcase className="size-3.5 text-black/60 dark:text-white/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-black dark:text-white">
                      {scraper.jobTitle}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-black/40 dark:text-white/40">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {scraper.location || 'Any location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <GraduationCap className="size-3" />
                        {experienceLevelLabels[scraper.experienceLevel] || 'Any'}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-black/50 dark:bg-white/5 dark:text-white/50">
                    #{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
            <h4 className="mb-2 text-xs font-medium text-black/60 dark:text-white/60">
              How it works
            </h4>
            <ul className="space-y-1.5 text-[11px] text-black/50 dark:text-white/50">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/30 dark:bg-white/30" />
                Scrapers will be queued and run one at a time
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/30 dark:bg-white/30" />
                You can cancel queued scrapers before they start
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-black/30 dark:bg-white/30" />
                Results will appear as each scraper completes
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-black/5 bg-black/[0.02] px-5 py-4 dark:border-white/5 dark:bg-white/[0.02]">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isConfirming}
            className="h-9 rounded-full px-4 text-sm text-black/60 hover:bg-black/5 hover:text-black dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || isRunning || scrapers.length === 0}
            className="h-9 rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="mr-2 size-4" />
                Run {scrapers.length} Scraper{scrapers.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
