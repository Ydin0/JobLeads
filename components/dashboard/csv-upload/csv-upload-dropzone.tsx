'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, Download, AlertCircle, FileText, Table2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  validateFile,
  MAX_FILE_SIZE_MB,
  SUPPORTED_FILE_TYPES,
} from '@/lib/csv-import'

interface CSVUploadDropzoneProps {
  onFileSelect: (file: File) => void
  onDownloadTemplate: () => void
  isLoading: boolean
  selectedFile: File | null
  fileError?: string | null
}

export function CSVUploadDropzone({
  onFileSelect,
  onDownloadTemplate,
  isLoading,
  selectedFile,
  fileError,
}: CSVUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateAndSelectFile = useCallback(
    (file: File) => {
      setValidationError(null)
      const validation = validateFile(file)
      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file')
        return
      }
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        validateAndSelectFile(file)
      }
    },
    [validateAndSelectFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        validateAndSelectFile(file)
      }
    },
    [validateAndSelectFile]
  )

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'xlsx' || ext === 'xls') {
      return <Table2 className="size-5 text-[var(--theme-accent)] dark:text-purple-500" />
    }
    return <FileText className="size-5 text-[var(--theme-accent)] dark:text-purple-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const displayError = validationError || fileError

  return (
    <div className="space-y-4">
      {/* Error Display */}
      {displayError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <AlertCircle className="size-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Upload Error</p>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">{displayError}</p>
          </div>
        </div>
      )}

      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 dark:border-purple-500 dark:bg-purple-500/5'
            : displayError
              ? 'border-red-500/30 bg-red-500/5 hover:border-red-500/50 dark:border-red-500/30 dark:bg-red-500/5'
              : 'border-black/10 bg-black/[0.02] hover:border-black/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
        )}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 animate-spin rounded-full border-3 border-[var(--theme-accent)]/20 border-t-[var(--theme-accent)] dark:border-purple-500/20 dark:border-t-purple-500" />
            <p className="text-sm text-black/60 dark:text-white/60">Reading file...</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--theme-accent)]/10 to-red-500/10 dark:from-purple-500/10 dark:to-blue-500/10">
              <Upload className="size-8 text-[var(--theme-accent)] dark:text-purple-500" />
            </div>

            <h3 className="mb-1 text-sm font-medium text-black dark:text-white">
              {isDragging ? 'Drop your file here' : 'Drag and drop your file'}
            </h3>
            <p className="mb-4 text-xs text-black/40 dark:text-white/40">or click to browse</p>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 dark:bg-white/5">
                <FileText className="size-3.5 text-black/40 dark:text-white/40" />
                <span className="text-xs text-black/60 dark:text-white/60">.csv</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 dark:bg-white/5">
                <Table2 className="size-3.5 text-black/40 dark:text-white/40" />
                <span className="text-xs text-black/60 dark:text-white/60">.xlsx</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-black/5 px-3 py-1.5 dark:bg-white/5">
                <span className="text-xs text-black/40 dark:text-white/40">Max {MAX_FILE_SIZE_MB}MB</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected File Display */}
      {selectedFile && !isLoading && !displayError && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 p-3 dark:border-purple-500/20 dark:bg-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--theme-accent)]/10 dark:bg-purple-500/10">
              {getFileIcon(selectedFile.name)}
            </div>
            <div>
              <p className="text-sm font-medium text-black dark:text-white">{selectedFile.name}</p>
              <p className="text-xs text-black/40 dark:text-white/40">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Download */}
      <div className="flex items-center justify-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDownloadTemplate}
          className="h-8 gap-1.5 text-xs text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
        >
          <Download className="size-3.5" />
          Download CSV template
        </Button>
      </div>
    </div>
  )
}
