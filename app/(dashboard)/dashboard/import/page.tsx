'use client'

import { useState } from 'react'
import { FileSpreadsheet, Upload, Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CSVUploadModal } from '@/components/dashboard/csv-upload'

export default function ImportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDownloadTemplate = async () => {
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
      console.error('Failed to download template:', error)
    }
  }

  return (
    <>
      <CSVUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-black dark:text-white">Import Data</h1>
          <p className="mt-1 text-sm text-black/60 dark:text-white/60">
            Upload your own companies and contacts from CSV files
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload Card */}
          <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--theme-accent)]/10 to-red-500/10 dark:from-purple-500/10 dark:to-blue-500/10">
              <Upload className="size-6 text-[var(--theme-accent)] dark:text-purple-500" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-black dark:text-white">
              Import from CSV
            </h2>
            <p className="mb-6 text-sm text-black/60 dark:text-white/60">
              Upload a CSV file containing companies and their contacts. We&apos;ll automatically
              map the columns and validate the data before importing.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-2 bg-[var(--theme-accent)] text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
            >
              <Plus className="size-4" />
              Upload CSV
            </Button>
          </div>

          {/* Template Card */}
          <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
              <FileSpreadsheet className="size-6 text-green-500" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-black dark:text-white">
              Download Template
            </h2>
            <p className="mb-6 text-sm text-black/60 dark:text-white/60">
              Not sure how to format your data? Download our CSV template with example data and all
              supported columns.
            </p>
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <Download className="size-4" />
              Download Template
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 rounded-xl border border-black/5 bg-black/[0.01] p-6 dark:border-white/5 dark:bg-white/[0.01]">
          <h3 className="mb-4 text-sm font-medium text-black dark:text-white">
            How it works
          </h3>
          <div className="grid gap-4 sm:grid-cols-4">
            <Step
              number={1}
              title="Upload"
              description="Select your CSV file with company and contact data"
            />
            <Step
              number={2}
              title="Map Columns"
              description="Match your CSV columns to our system fields"
            />
            <Step
              number={3}
              title="Preview"
              description="Review the data and check for any validation issues"
            />
            <Step
              number={4}
              title="Import"
              description="Import your data and optionally enrich with Apollo"
            />
          </div>
        </div>

        {/* Supported Fields */}
        <div className="mt-6 rounded-xl border border-black/5 bg-black/[0.01] p-6 dark:border-white/5 dark:bg-white/[0.01]">
          <h3 className="mb-4 text-sm font-medium text-black dark:text-white">
            Supported Fields
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                Company Fields
              </h4>
              <ul className="space-y-1 text-sm text-black/60 dark:text-white/60">
                <li>Company Name <span className="text-red-500">*</span></li>
                <li>Company Domain</li>
                <li>Industry</li>
                <li>Company Size</li>
                <li>Company Location</li>
                <li>Company LinkedIn URL</li>
                <li>Company Website</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-black/40 dark:text-white/40">
                Contact Fields
              </h4>
              <ul className="space-y-1 text-sm text-black/60 dark:text-white/60">
                <li>First Name <span className="text-red-500">*</span></li>
                <li>Last Name <span className="text-red-500">*</span></li>
                <li>Email</li>
                <li>Phone</li>
                <li>Job Title</li>
                <li>LinkedIn URL</li>
                <li>Location</li>
                <li>Seniority</li>
                <li>Department</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 text-xs text-black/40 dark:text-white/40">
            <span className="text-red-500">*</span> Required fields
          </p>
        </div>
      </div>
    </>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: number
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--theme-accent)]/10 text-sm font-medium text-[var(--theme-accent)] dark:bg-purple-500/10 dark:text-purple-400">
        {number}
      </div>
      <div>
        <h4 className="text-sm font-medium text-black dark:text-white">{title}</h4>
        <p className="text-xs text-black/60 dark:text-white/60">{description}</p>
      </div>
    </div>
  )
}
