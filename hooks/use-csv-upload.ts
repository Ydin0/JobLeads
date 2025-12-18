'use client'

import { useState, useCallback } from 'react'
import type { ColumnMapping } from '@/lib/csv-import'
import type { PreviewResponse } from '@/app/api/csv-upload/preview/route'
import type { UploadResponse } from '@/app/api/csv-upload/route'

export type UploadStep = 'upload' | 'mapping' | 'preview' | 'processing' | 'results'

export interface CSVUploadState {
  step: UploadStep
  file: File | null
  csvContent: string | null
  headers: string[]
  columnMapping: ColumnMapping
  previewData: PreviewResponse | null
  uploadResult: UploadResponse | null
  isLoading: boolean
  error: string | null
}

export interface UploadOptions {
  updateExisting: boolean
  enrichWithApollo: boolean
}

export function useCSVUpload() {
  const [state, setState] = useState<CSVUploadState>({
    step: 'upload',
    file: null,
    csvContent: null,
    headers: [],
    columnMapping: {},
    previewData: null,
    uploadResult: null,
    isLoading: false,
    error: null,
  })

  const [options, setOptions] = useState<UploadOptions>({
    updateExisting: false,
    enrichWithApollo: false,
  })

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      csvContent: null,
      headers: [],
      columnMapping: {},
      previewData: null,
      uploadResult: null,
      isLoading: false,
      error: null,
    })
    setOptions({
      updateExisting: false,
      enrichWithApollo: false,
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
      const content = await file.text()

      // Quick parse to get headers
      const lines = content.split('\n')
      if (lines.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Parse first line as headers (handle quoted values)
      const headerLine = lines[0]
      const headers = parseCSVLine(headerLine)

      setState((prev) => ({
        ...prev,
        csvContent: content,
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

    setState((prev) => ({ ...prev, step: 'processing', isLoading: true, error: null }))

    try {
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

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload CSV')
      }

      const data: UploadResponse = await response.json()

      setState((prev) => ({
        ...prev,
        uploadResult: data,
        step: 'results',
        isLoading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        step: 'preview', // Go back to preview on error
        error: error instanceof Error ? error.message : 'Failed to upload CSV',
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
