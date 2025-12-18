'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    X,
    Download,
    FileSpreadsheet,
    Building2,
    Users,
    StickyNote,
    Check,
} from 'lucide-react'
import { exportToCSV, getExportCount, type ExportOptions } from '@/lib/crm-export'
import type { CompanyWithLeads } from '@/hooks/use-crm-leads'

interface CRMExportModalProps {
    companies: CompanyWithLeads[]
    selectedCompanyIds?: string[]
    isOpen: boolean
    onClose: () => void
}

export function CRMExportModal({
    companies,
    selectedCompanyIds,
    isOpen,
    onClose,
}: CRMExportModalProps) {
    const [isExporting, setIsExporting] = useState(false)
    const [options, setOptions] = useState<ExportOptions>({
        includeCompanyInfo: true,
        includeContactInfo: true,
        includeNotes: true,
        selectedCompanyIds: selectedCompanyIds,
    })

    const exportCount = useMemo(() => {
        return getExportCount(companies, options)
    }, [companies, options])

    const handleExport = async () => {
        setIsExporting(true)
        try {
            const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
            exportToCSV(companies, options, filename)
            onClose()
        } catch (error) {
            console.error('Export failed:', error)
        } finally {
            setIsExporting(false)
        }
    }

    const toggleOption = (key: keyof Omit<ExportOptions, 'selectedCompanyIds'>) => {
        setOptions((prev) => ({ ...prev, [key]: !prev[key] }))
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0a0a0f]/95 dark:shadow-purple-500/5 dark:backdrop-blur-xl">
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
                            <h2 className="text-sm font-semibold text-black dark:text-white">
                                Export to CSV
                            </h2>
                            <p className="text-[10px] text-black/40 dark:text-white/40">
                                Close CRM compatible format
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-black/40 hover:bg-black/5 hover:text-black/60 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative flex-1 p-4">
                    {/* Export Stats */}
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <Building2 className="size-4 text-black/40 dark:text-white/40" />
                                <span className="text-xs text-black/40 dark:text-white/40">
                                    Companies
                                </span>
                            </div>
                            <div className="mt-1 text-xl font-semibold text-black dark:text-white">
                                {exportCount.companies}
                            </div>
                        </div>
                        <div className="rounded-lg border border-black/5 bg-black/[0.02] p-3 dark:border-white/5 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-black/40 dark:text-white/40" />
                                <span className="text-xs text-black/40 dark:text-white/40">
                                    Contacts
                                </span>
                            </div>
                            <div className="mt-1 text-xl font-semibold text-black dark:text-white">
                                {exportCount.contacts}
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-medium text-black/60 dark:text-white/60">
                            Include in export
                        </h3>

                        <ExportOption
                            icon={Building2}
                            label="Company information"
                            description="Name, domain, industry, size, location"
                            checked={options.includeCompanyInfo}
                            onChange={() => toggleOption('includeCompanyInfo')}
                        />

                        <ExportOption
                            icon={Users}
                            label="Contact information"
                            description="Name, title, email, phone, LinkedIn"
                            checked={options.includeContactInfo}
                            onChange={() => toggleOption('includeContactInfo')}
                        />

                        <ExportOption
                            icon={StickyNote}
                            label="Notes"
                            description="Lead notes and comments"
                            checked={options.includeNotes}
                            onChange={() => toggleOption('includeNotes')}
                        />
                    </div>

                    {/* Selection info */}
                    {selectedCompanyIds && selectedCompanyIds.length > 0 && (
                        <div className="mt-4 rounded-lg border border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 p-3 dark:border-purple-500/20 dark:bg-purple-500/5">
                            <p className="text-xs text-[var(--theme-accent)] dark:text-purple-400">
                                Exporting {selectedCompanyIds.length} selected{' '}
                                {selectedCompanyIds.length === 1 ? 'company' : 'companies'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="relative flex shrink-0 items-center justify-between border-t border-black/5 bg-black/[0.02] px-4 py-3 dark:border-white/5 dark:bg-white/[0.02]">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 px-3 text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleExport}
                        disabled={isExporting || exportCount.contacts === 0}
                        className="h-8 bg-[var(--theme-accent)] px-4 text-xs text-white hover:bg-[var(--theme-accent)]/90 dark:bg-purple-500 dark:hover:bg-purple-600"
                    >
                        {isExporting ? (
                            <>
                                <div className="mr-2 size-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-1.5 size-3" />
                                Download CSV
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}

function ExportOption({
    icon: Icon,
    label,
    description,
    checked,
    onChange,
}: {
    icon: React.ElementType
    label: string
    description: string
    checked: boolean
    onChange: () => void
}) {
    return (
        <button
            onClick={onChange}
            className={cn(
                'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                checked
                    ? 'border-[var(--theme-accent)]/20 bg-[var(--theme-accent)]/5 dark:border-purple-500/20 dark:bg-purple-500/5'
                    : 'border-black/5 bg-black/[0.01] hover:bg-black/[0.02] dark:border-white/5 dark:bg-white/[0.01] dark:hover:bg-white/[0.02]'
            )}
        >
            <div
                className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                    checked
                        ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)] dark:border-purple-500 dark:bg-purple-500'
                        : 'border-black/20 dark:border-white/20'
                )}
            >
                {checked && <Check className="size-3 text-white" />}
            </div>
            <Icon className="size-4 shrink-0 text-black/40 dark:text-white/40" />
            <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-black dark:text-white">{label}</div>
                <div className="text-[10px] text-black/40 dark:text-white/40">
                    {description}
                </div>
            </div>
        </button>
    )
}
