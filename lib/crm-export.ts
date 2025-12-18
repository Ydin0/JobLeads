// CRM Export Utilities
// Export leads data to CSV format compatible with Close CRM

import type { CompanyWithLeads } from '@/hooks/use-crm-leads'

export interface ExportOptions {
    includeCompanyInfo: boolean
    includeContactInfo: boolean
    includeNotes: boolean
    selectedCompanyIds?: string[]
}

interface ExportRow {
    Company: string
    'Company Domain': string
    'Company Industry': string
    'Company Size': string
    'Company Location': string
    'Contact Name': string
    'Contact Title': string
    'Contact Email': string
    'Contact Phone': string
    'Lead Status': string
    'LinkedIn URL': string
    Notes: string
}

// Escape CSV field - handles commas, quotes, and newlines
function escapeCSVField(value: string | null | undefined): string {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

// Convert companies with leads to CSV rows
function toExportRows(
    companies: CompanyWithLeads[],
    options: ExportOptions
): ExportRow[] {
    const rows: ExportRow[] = []

    for (const { company, leads } of companies) {
        // Filter by selected companies if specified
        if (options.selectedCompanyIds && !options.selectedCompanyIds.includes(company.id)) {
            continue
        }

        for (const lead of leads) {
            const row: ExportRow = {
                Company: options.includeCompanyInfo ? company.name : '',
                'Company Domain': options.includeCompanyInfo ? company.domain || '' : '',
                'Company Industry': options.includeCompanyInfo ? company.industry || '' : '',
                'Company Size': options.includeCompanyInfo ? company.size || '' : '',
                'Company Location': options.includeCompanyInfo ? company.location || '' : '',
                'Contact Name': options.includeContactInfo
                    ? `${lead.firstName} ${lead.lastName}`
                    : '',
                'Contact Title': options.includeContactInfo ? lead.jobTitle || '' : '',
                'Contact Email': options.includeContactInfo ? lead.email || '' : '',
                'Contact Phone': options.includeContactInfo ? lead.phone || '' : '',
                'Lead Status': lead.status || 'new',
                'LinkedIn URL': options.includeContactInfo ? lead.linkedinUrl || '' : '',
                Notes: options.includeNotes ? lead.notes || '' : '',
            }
            rows.push(row)
        }
    }

    return rows
}

// Generate CSV string from rows
function rowsToCSV(rows: ExportRow[]): string {
    if (rows.length === 0) return ''

    const headers = Object.keys(rows[0]) as (keyof ExportRow)[]
    const headerLine = headers.map(escapeCSVField).join(',')

    const dataLines = rows.map((row) =>
        headers.map((header) => escapeCSVField(row[header])).join(',')
    )

    return [headerLine, ...dataLines].join('\n')
}

// Export to CSV file (triggers download)
export function exportToCSV(
    companies: CompanyWithLeads[],
    options: ExportOptions,
    filename: string = 'leads-export.csv'
): void {
    const rows = toExportRows(companies, options)
    const csv = rowsToCSV(rows)

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.href = url
    link.download = filename
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

// Get export preview (first N rows)
export function getExportPreview(
    companies: CompanyWithLeads[],
    options: ExportOptions,
    maxRows: number = 5
): ExportRow[] {
    const rows = toExportRows(companies, options)
    return rows.slice(0, maxRows)
}

// Get export count
export function getExportCount(
    companies: CompanyWithLeads[],
    options: ExportOptions
): { companies: number; contacts: number } {
    let companyCount = 0
    let contactCount = 0

    for (const { company, leads } of companies) {
        if (options.selectedCompanyIds && !options.selectedCompanyIds.includes(company.id)) {
            continue
        }
        companyCount++
        contactCount += leads.length
    }

    return { companies: companyCount, contacts: contactCount }
}

// Close CRM specific format (if needed for direct API integration later)
export interface CloseCRMLead {
    company: string
    url?: string
    contacts: {
        name: string
        title?: string
        emails?: { email: string; type: string }[]
        phones?: { phone: string; type: string }[]
    }[]
    custom?: Record<string, string>
}

// Convert to Close CRM API format (for future API integration)
export function toCloseCRMFormat(companies: CompanyWithLeads[]): CloseCRMLead[] {
    return companies.map(({ company, leads }) => ({
        company: company.name,
        url: company.websiteUrl || company.domain ? `https://${company.domain}` : undefined,
        contacts: leads.map((lead) => ({
            name: `${lead.firstName} ${lead.lastName}`,
            title: lead.jobTitle || undefined,
            emails: lead.email ? [{ email: lead.email, type: 'office' }] : undefined,
            phones: lead.phone ? [{ phone: lead.phone, type: 'office' }] : undefined,
        })),
        custom: {
            industry: company.industry || '',
            size: company.size || '',
            location: company.location || '',
        },
    }))
}
