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
    Loader2,
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
                className="absolute inset-0 bg-black/50 dark:bg-black/70"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0a0a0f]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                            <FileSpreadsheet className="size-4 text-black/60 dark:text-white/60" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-black dark:text-white">
                                Export to CSV
                            </h2>
                            <p className="text-xs text-black/40 dark:text-white/40">
                                CRM compatible format
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Export Stats */}
                    <div className="flex items-center gap-6 border-b border-black/5 pb-5 dark:border-white/5">
                        <div>
                            <div className="text-2xl font-semibold text-black dark:text-white">
                                {exportCount.companies}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                                <Building2 className="size-3" />
                                Companies
                            </div>
                        </div>
                        <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                        <div>
                            <div className="text-2xl font-semibold text-black dark:text-white">
                                {exportCount.contacts}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-black/50 dark:text-white/50">
                                <Users className="size-3" />
                                Contacts
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="mt-5 space-y-2">
                        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-black/40 dark:text-white/40">
                            Include in export
                        </h3>

                        <div className="mt-3 space-y-2">
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
                    </div>

                    {/* Selection info */}
                    {selectedCompanyIds && selectedCompanyIds.length > 0 && (
                        <div className="mt-4 rounded-lg bg-[#F8F7FF] px-3 py-2 dark:bg-white/5">
                            <p className="text-xs text-black/60 dark:text-white/60">
                                Exporting {selectedCompanyIds.length} selected{' '}
                                {selectedCompanyIds.length === 1 ? 'company' : 'companies'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-black/5 px-5 py-4 dark:border-white/5">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-9 rounded-full border-black/10 px-4 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isExporting || exportCount.contacts === 0}
                        className="h-9 rounded-full bg-black px-4 text-sm font-medium text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/90"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 size-4" />
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
                    ? 'border-black/10 bg-[#F8F7FF] dark:border-white/10 dark:bg-white/10'
                    : 'border-black/5 hover:border-black/10 hover:bg-black/[0.02] dark:border-white/5 dark:hover:border-white/10 dark:hover:bg-white/[0.02]'
            )}
        >
            <div
                className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
                    checked
                        ? 'border-black bg-black dark:border-white dark:bg-white'
                        : 'border-black/20 dark:border-white/20'
                )}
            >
                {checked && <Check className="size-2.5 text-white dark:text-black" />}
            </div>
            <Icon className="size-4 shrink-0 text-black/40 dark:text-white/40" />
            <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-black dark:text-white">{label}</div>
                <div className="text-xs text-black/40 dark:text-white/40">
                    {description}
                </div>
            </div>
        </button>
    )
}
