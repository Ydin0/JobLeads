'use client'

import { useState, useCallback } from 'react'
import type { ColumnMapping, MappingTemplate } from '@/lib/csv-import'
import {
  validateFile,
  parseCSV,
  parseXLSX,
  getMappingTemplates,
  saveMappingTemplate,
  deleteMappingTemplate,
} from '@/lib/csv-import'
import type { PreviewResponse } from '@/app/api/csv-upload/preview/route'
import type { UploadResponse } from '@/app/api/csv-upload/route'

export type UploadStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'results'
export type FileType = 'csv' | 'xlsx' | 'xls'

export interface UploadProgress {
  phase: 'validating' | 'processing' | 'completing'
  current: number
  total: number
  message: string
}

export interface CSVUploadState {
  step: UploadStep
  file: File | null
  fileType: FileType | null
  csvContent: string | null
  xlsxContent: ArrayBuffer | null
  headers: string[]
  columnMapping: ColumnMapping
  previewData: PreviewResponse | null
  uploadResult: UploadResponse | null
  isLoading: boolean
  error: string | null
  mappingTemplates: MappingTemplate[]
  progress: UploadProgress | null
}

export interface UploadOptions {
  updateExisting: boolean
  enrichWithApollo: boolean
  skipInvalidRows: boolean
  duplicateHandling: 'skip' | 'update' | 'create'
}

export function useCSVUpload() {
  const [state, setState] = useState<CSVUploadState>({
    step: 'upload',
    file: null,
    fileType: null,
    csvContent: null,
    xlsxContent: null,
    headers: [],
    columnMapping: {},
    previewData: null,
    uploadResult: null,
    isLoading: false,
    error: null,
    mappingTemplates: [],
    progress: null,
  })

  const [options, setOptions] = useState<UploadOptions>({
    updateExisting: false,
    enrichWithApollo: false,
    skipInvalidRows: true,
    duplicateHandling: 'skip',
  })

  // Load mapping templates on mount
  const loadMappingTemplates = useCallback(() => {
    const templates = getMappingTemplates()
    setState((prev) => ({ ...prev, mappingTemplates: templates }))
  }, [])

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      fileType: null,
      csvContent: null,
      xlsxContent: null,
      headers: [],
      columnMapping: {},
      previewData: null,
      uploadResult: null,
      isLoading: false,
      error: null,
      mappingTemplates: getMappingTemplates(),
      progress: null,
    })
    setOptions({
      updateExisting: false,
      enrichWithApollo: false,
      skipInvalidRows: true,
      duplicateHandling: 'skip',
    })
  }, [])

  const setFile = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      file,
    }))

    try {
      // Determine file type from extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      const fileType: FileType = extension === 'xlsx' || extension === 'xls' ? 'xlsx' : 'csv'

      let headers: string[] = []
      let csvContent: string | null = null
      let xlsxContent: ArrayBuffer | null = null

      if (fileType === 'xlsx') {
        // Read as ArrayBuffer for XLSX files
        xlsxContent = await file.arrayBuffer()
        const parseResult = parseXLSX(xlsxContent)

        headers = parseResult.headers
        // Convert XLSX data to CSV format for API compatibility
        csvContent = convertToCSV(parseResult.headers, parseResult.rows)
      } else {
        // Read as text for CSV files
        csvContent = await file.text()

        // Quick parse to get headers
        const lines = csvContent.split('\n')
        if (lines.length === 0) {
          throw new Error('CSV file is empty')
        }

        // Parse first line as headers (handle quoted values)
        const headerLine = lines[0]
        headers = parseCSVLine(headerLine)
      }

      setState((prev) => ({
        ...prev,
        fileType,
        csvContent,
        xlsxContent,
        headers,
        step: 'mapping',
        isLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      }))
    }
  }, [])

  const setColumnMapping = useCallback((mapping: ColumnMapping) => {
    setState((prev) => ({
      ...prev,
      columnMapping: mapping,
    }))
  }, [])

  const fetchPreview = useCallback(async () => {
    if (!state.csvContent) {
      setState((prev) => ({ ...prev, error: 'No CSV content loaded' }))
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/api/csv-upload/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: state.csvContent,
          columnMapping: state.columnMapping,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to preview CSV')
      }

      const data: PreviewResponse = await response.json()

      setState((prev) => ({
        ...prev,
        previewData: data,
        columnMapping: data.suggestedMapping,
        step: 'preview',
        isLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to preview CSV',
      }))
    }
  }, [state.csvContent, state.columnMapping])

  const executeUpload = useCallback(async () => {
    if (!state.csvContent || !state.file) {
      setState((prev) => ({ ...prev, error: 'No CSV content loaded' }))
      return
    }

    // Estimate total rows from CSV content
    const estimatedRows = state.csvContent.split('\n').length - 1

    setState((prev) => ({
      ...prev,
      step: 'processing',
      isLoading: true,
      error: null,
      progress: {
        phase: 'validating',
        current: 0,
        total: estimatedRows,
        message: 'Validating data...',
      },
    }))

    try {
      // Simulate progress updates for better UX
      const progressInterval = setInterval(() => {
        setState((prev) => {
          if (!prev.progress || prev.progress.phase === 'completing') return prev

          const newCurrent = Math.min(prev.progress.current + Math.ceil(estimatedRows / 10), estimatedRows - 1)
          const newPhase = newCurrent > estimatedRows * 0.3 ? 'processing' : 'validating'
          const newMessage = newPhase === 'validating'
            ? 'Validating data...'
            : `Processing row ${newCurrent} of ${estimatedRows}...`

          return {
            ...prev,
            progress: {
              ...prev.progress,
              phase: newPhase,
              current: newCurrent,
              message: newMessage,
            },
          }
        })
      }, 200)

      const response = await fetch('/api/csv-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: state.csvContent,
          columnMapping: state.columnMapping,
          fileName: state.file.name,
          options,
        }),
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload CSV')
      }

      const data: UploadResponse = await response.json()

      // Final progress update
      setState((prev) => ({
        ...prev,
        progress: {
          phase: 'completing',
          current: estimatedRows,
          total: estimatedRows,
          message: 'Import complete!',
        },
      }))

      // Small delay before showing results
      await new Promise((resolve) => setTimeout(resolve, 500))

      setState((prev) => ({
        ...prev,
        uploadResult: data,
        step: 'results',
        isLoading: false,
        progress: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        step: 'preview', // Go back to preview on error
        error: error instanceof Error ? error.message : 'Failed to upload CSV',
        progress: null,
      }))
    }
  }, [state.csvContent, state.columnMapping, state.file, options])

  const goToStep = useCallback((step: UploadStep) => {
    setState((prev) => ({ ...prev, step, error: null }))
  }, [])

  const downloadTemplate = useCallback(async () => {
    try {
      const response = await fetch('/api/csv-upload/template')
      if (!response.ok) throw new Error('Failed to download template')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'import-template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to download template',
      }))
    }
  }, [])

  return {
    ...state,
    options,
    setOptions,
    setFile,
    setColumnMapping,
    fetchPreview,
    executeUpload,
    goToStep,
    downloadTemplate,
    reset,
  }
}

// Helper to parse a CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

// Helper to convert XLSX data to CSV format
function convertToCSV(headers: string[], data: string[][]): string {
  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  const headerLine = headers.map(escapeCSVValue).join(',')
  const dataLines = data.map((row) => row.map(escapeCSVValue).join(','))

  return [headerLine, ...dataLines].join('\n')
}
