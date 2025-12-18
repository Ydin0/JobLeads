'use client'

import { useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, FileSpreadsheet, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CSVUploadDropzoneProps {
  onFileSelect: (file: File) => void
  onDownloadTemplate: () => void
  isLoading: boolean
  selectedFile: File | null
}

export function CSVUploadDropzone({
  onFileSelect,
  onDownloadTemplate,
  isLoading,
  selectedFile,
}: CSVUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file && file.type === 'text/csv') {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/5 dark:border-purple-500 dark:bg-purple-500/5'
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
              {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
            </h3>
            <p className="mb-4 text-xs text-black/40 dark:text-white/40">or click to browse</p>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="absolute inset-0 cursor-pointer opacity-0"
            />

            <div className="flex items-center gap-2 rounded-lg bg-black/5 px-3 py-1.5 dark:bg-white/5">
              <FileSpreadsheet className="size-3.5 text-black/40 dark:text-white/40" />
              <span className="text-xs text-black/60 dark:text-white/60">.csv files only</span>
            </div>
          </>
        )}
      </div>

      {/* Selected File Display */}
      {selectedFile && !isLoading && (
        <div className="flex items-center justify-between rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 p-3 dark:border-purple-500/20 dark:bg-purple-500/5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-[var(--theme-accent)]/10 dark:bg-purple-500/10">
              <FileSpreadsheet className="size-5 text-[var(--theme-accent)] dark:text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-black dark:text-white">{selectedFile.name}</p>
              <p className="text-xs text-black/40 dark:text-white/40">
                {(selectedFile.size / 1024).toFixed(1)} KB
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
