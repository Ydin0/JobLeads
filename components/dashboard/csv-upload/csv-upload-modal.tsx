'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  X,
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Columns,
  Eye,
  Loader2,
  Settings2,
} from 'lucide-react'
import { useCSVUpload, type UploadStep } from '@/hooks/use-csv-upload'
import { CSVUploadDropzone } from './csv-upload-dropzone'
import { CSVColumnMapper } from './csv-column-mapper'
import { CSVPreviewTable } from './csv-preview-table'
import { CSVUploadResults } from './csv-upload-results'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
}

const STEPS: { key: UploadStep; label: string; icon: React.ElementType }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'mapping', label: 'Map Columns', icon: Columns },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'processing', label: 'Processing', icon: Loader2 },
  { key: 'results', label: 'Results', icon: Check },
]

export function CSVUploadModal({ isOpen, onClose }: CSVUploadModalProps) {
  const router = useRouter()
  const {
    step,
    file,
    headers,
    columnMapping,
    previewData,
    uploadResult,
    isLoading,
    error,
    options,
    progress,
    setOptions,
    setFile,
    setColumnMapping,
    fetchPreview,
    executeUpload,
    goToStep,
    downloadTemplate,
    reset,
  } = useCSVUpload()

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleViewCompanies = () => {
    handleClose()
    router.push('/dashboard/companies')
  }

  const handleNext = async () => {
    if (step === 'mapping') {
      await fetchPreview()
    } else if (step === 'preview') {
      await executeUpload()
    }
  }

  const handleBack = () => {
    if (step === 'mapping') {
      goToStep('upload')
    } else if (step === 'preview') {
      goToStep('mapping')
    }
  }

  const canGoNext = () => {
    if (step === 'upload') return !!file
    if (step === 'mapping') {
      // Check required fields are mapped
      const required = ['companyName', 'contactFirstName', 'contactLastName']
      return required.every(
        (key) => columnMapping[key] !== null && columnMapping[key] !== undefined
      )
    }
    if (step === 'preview') return previewData?.valid
    return false
  }

  if (!isOpen) return null

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0a0a0f]/95 dark:shadow-purple-500/5 dark:backdrop-blur-xl">
        {/* Gradient accents */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/50 to-transparent dark:via-purple-500/50" />
        <div className="absolute -left-20 -top-20 size-40 rounded-full bg-[var(--theme-accent)]/10 blur-3xl dark:bg-purple-500/10" />
        <div className="absolute -right-20 -top-20 size-40 rounded-full bg-red-500/10 blur-3xl dark:bg-blue-500/10" />

        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--theme-accent)] to-red-500 dark:from-purple-500 dark:to-blue-500">
              <FileSpreadsheet className="size-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-black dark:text-white">Import from CSV</h2>
              <p className="text-[10px] text-black/40 dark:text-white/40">
                Upload companies and contacts
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Steps Indicator */}
        <div className="relative flex shrink-0 items-center justify-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/5">
          {STEPS.filter((s) => s.key !== 'processing').map((s, index) => {
            const isActive = s.key === step || (step === 'processing' && s.key === 'preview')
            const isPast =
              currentStepIndex > index || (step === 'results' && s.key !== 'results')
            const Icon = s.icon

            return (
              <div key={s.key} className="flex items-center">
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors',
                    isActive
                      ? 'bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] dark:bg-purple-500/10 dark:text-purple-400'
                      : isPast
                        ? 'text-black/60 dark:text-white/60'
                        : 'text-black/30 dark:text-white/30'
                  )}
                >
                  {isPast && !isActive ? (
                    <Check className="size-3" />
                  ) : (
                    <Icon className={cn('size-3', step === 'processing' && 'animate-spin')} />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {index < STEPS.filter((s) => s.key !== 'processing').length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-px w-8',
                      isPast ? 'bg-[var(--theme-accent)]/30 dark:bg-purple-500/30' : 'bg-black/10 dark:bg-white/10'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {step === 'upload' && (
            <CSVUploadDropzone
              onFileSelect={setFile}
              onDownloadTemplate={downloadTemplate}
              isLoading={isLoading}
              selectedFile={file}
            />
          )}

          {step === 'mapping' && (
            <CSVColumnMapper
              headers={headers}
              mapping={columnMapping}
              onMappingChange={setColumnMapping}
            />
          )}

          {step === 'preview' && previewData && (
            <div className="space-y-4">
              <CSVPreviewTable previewData={previewData} />

              {/* Import Options */}
              <div className="rounded-lg border border-black/5 bg-black/[0.02] p-4 dark:border-white/5 dark:bg-white/[0.02]">
                <div className="mb-3 flex items-center gap-2">
                  <Settings2 className="size-4 text-black/40 dark:text-white/40" />
                  <span className="text-xs font-medium text-black dark:text-white">
                    Import Options
                  </span>
                </div>
                <div className="space-y-3">
                  {/* Duplicate Handling */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-black dark:text-white">
                      Duplicate Handling
                    </label>
                    <select
                      value={options.duplicateHandling}
                      onChange={(e) =>
                        setOptions({
                          ...options,
                          duplicateHandling: e.target.value as 'skip' | 'update' | 'create',
                          updateExisting: e.target.value === 'update',
                        })
                      }
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-black focus:border-[var(--theme-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--theme-accent)] dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-purple-500 dark:focus:ring-purple-500"
                    >
                      <option value="skip">Skip duplicates (don't import)</option>
                      <option value="update">Update existing records</option>
                      <option value="create">Create new records anyway</option>
                    </select>
                    <p className="text-[10px] text-black/40 dark:text-white/40">
                      {options.duplicateHandling === 'skip' && 'Duplicates found by email or domain will be skipped'}
                      {options.duplicateHandling === 'update' && 'Existing records will be updated with new data'}
                      {options.duplicateHandling === 'create' && 'New records will be created even if duplicates exist'}
                    </p>
                  </div>

                  {/* Skip Invalid Rows */}
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={options.skipInvalidRows}
                      onChange={(e) => setOptions({ ...options, skipInvalidRows: e.target.checked })}
                      className="mt-0.5 size-4 rounded border-black/20 text-[var(--theme-accent)] focus:ring-[var(--theme-accent)] dark:border-white/20 dark:text-purple-500 dark:focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-black dark:text-white">
                        Skip invalid rows
                      </span>
                      <p className="text-[10px] text-black/40 dark:text-white/40">
                        Continue importing valid rows even if some rows have validation errors
                      </p>
                    </div>
                  </label>

                  {/* Enrich with Apollo */}
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={options.enrichWithApollo}
                      onChange={(e) =>
                        setOptions({ ...options, enrichWithApollo: e.target.checked })
                      }
                      className="mt-0.5 size-4 rounded border-black/20 text-[var(--theme-accent)] focus:ring-[var(--theme-accent)] dark:border-white/20 dark:text-purple-500 dark:focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-xs font-medium text-black dark:text-white">
                        Enrich with Apollo after import
                      </span>
                      <p className="text-[10px] text-black/40 dark:text-white/40">
                        Automatically enrich imported contacts with Apollo data (uses credits)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Terms Notice */}
              <div className="rounded-lg border border-black/5 bg-black/[0.01] p-3 dark:border-white/5 dark:bg-white/[0.01]">
                <p className="text-[10px] text-black/40 dark:text-white/40">
                  By uploading data, you agree that this information will be stored in our platform
                  database to improve our services.
                </p>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex min-h-[200px] flex-col items-center justify-center">
              <div className="mb-4 size-12 animate-spin rounded-full border-3 border-[var(--theme-accent)]/20 border-t-[var(--theme-accent)] dark:border-purple-500/20 dark:border-t-purple-500" />
              <p className="text-sm text-black/60 dark:text-white/60">
                {progress?.message || 'Importing your data...'}
              </p>
              {progress && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-black/40 dark:text-white/40">
                    <span>
                      {progress.phase === 'validating' && 'Validating'}
                      {progress.phase === 'processing' && 'Processing'}
                      {progress.phase === 'completing' && 'Completing'}
                    </span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--theme-accent)] to-red-500 transition-all duration-300 dark:from-purple-500 dark:to-blue-500"
                      style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-center text-[10px] text-black/40 dark:text-white/40">
                    {progress.current} of {progress.total} rows
                  </p>
                </div>
              )}
              {!progress && (
                <p className="text-xs text-black/40 dark:text-white/40">This may take a moment</p>
              )}
            </div>
          )}

          {step === 'results' && uploadResult && (
            <CSVUploadResults
              result={uploadResult}
              onClose={handleClose}
              onViewCompanies={handleViewCompanies}
            />
          )}
        </div>

        {/* Footer */}
        {step !== 'results' && step !== 'processing' && (
          <div className="relative flex shrink-0 items-center justify-between border-t border-black/5 bg-black/[0.02] px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]">
            <div>
              {step !== 'upload' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="h-8 gap-1.5 px-3 text-xs"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 px-3 text-xs">
                Cancel
              </Button>
              {step === 'upload' && file && (
                <Button
                  size="sm"
                  onClick={() => goToStep('mapping')}
                  className="h-8 gap-1.5 bg-[var(--theme-accent)] px-4 text-xs text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  Continue
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
              {step === 'mapping' && (
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={!canGoNext() || isLoading}
                  className="h-8 gap-1.5 bg-[var(--theme-accent)] px-4 text-xs text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      Preview
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              )}
              {step === 'preview' && (
                <Button
                  size="sm"
                  onClick={handleNext}
                  disabled={!canGoNext() || isLoading}
                  className="h-8 gap-1.5 bg-[var(--theme-accent)] px-4 text-xs text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Import Data
                      <Check className="size-3.5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
