import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, employees } from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and, inArray } from 'drizzle-orm'
import {
  parseCSV,
  autoDetectColumnMapping,
  validateAndTransformRows,
  groupByCompany,
  type ColumnMapping,
} from '@/lib/csv-import'

export interface PreviewRequest {
  csvContent: string
  columnMapping?: ColumnMapping
}

export interface PreviewResponse {
  valid: boolean
  totalRows: number
  validRows: number
  errors: Array<{ row: number; field: string; message: string }>
  warnings: Array<{ row: number; field: string; message: string }>
  headers: string[]
  suggestedMapping: ColumnMapping
  preview: {
    companies: Array<{
      name: string
      domain: string | null
      contactsCount: number
    }>
    contacts: Array<{
      firstName: string
      lastName: string
      email: string | null
      companyName: string
    }>
  }
  deduplication: {
    newCompanies: number
    existingCompanies: number
    newContacts: number
    existingContacts: number
  }
}

// POST /api/csv-upload/preview - Parse and preview CSV data
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth()
    const body: PreviewRequest = await req.json()

    if (!body.csvContent) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      )
    }

    // Parse CSV
    const parseResult = parseCSV(body.csvContent)

    // Auto-detect or use provided column mapping
    const suggestedMapping =
      body.columnMapping || autoDetectColumnMapping(parseResult.headers)

    // Validate and transform rows
    const validationResult = validateAndTransformRows(
      parseResult.rows,
      suggestedMapping
    )

    // Group by company for preview
    const groupedCompanies = groupByCompany(validationResult.parsedRows)

    // Check for existing companies and contacts in org tables
    const domains = groupedCompanies
      .map((c) => c.companyDomain)
      .filter((d): d is string => !!d)
    const emails = validationResult.parsedRows
      .map((r) => r.contactEmail)
      .filter((e): e is string => !!e)

    let existingOrgCompanies: string[] = []
    let existingOrgEmails: string[] = []

    if (domains.length > 0) {
      const existing = await db
        .select({ domain: companies.domain })
        .from(companies)
        .where(
          and(
            eq(companies.orgId, orgId),
            inArray(companies.domain, domains)
          )
        )
      existingOrgCompanies = existing
        .map((c) => c.domain)
        .filter((d): d is string => !!d)
    }

    if (emails.length > 0) {
      const existing = await db
        .select({ email: employees.email })
        .from(employees)
        .where(
          and(
            eq(employees.orgId, orgId),
            inArray(employees.email, emails)
          )
        )
      existingOrgEmails = existing
        .map((e) => e.email)
        .filter((e): e is string => !!e)
    }

    // Calculate deduplication stats
    const newCompanyDomains = domains.filter(
      (d) => !existingOrgCompanies.includes(d.toLowerCase())
    )
    const newContactEmails = emails.filter(
      (e) => !existingOrgEmails.includes(e.toLowerCase())
    )

    // Build preview data
    const preview = {
      companies: groupedCompanies.slice(0, 10).map((c) => ({
        name: c.companyName,
        domain: c.companyDomain,
        contactsCount: c.contacts.length,
      })),
      contacts: validationResult.parsedRows.slice(0, 20).map((r) => ({
        firstName: r.contactFirstName,
        lastName: r.contactLastName,
        email: r.contactEmail,
        companyName: r.companyName,
      })),
    }

    const response: PreviewResponse = {
      valid: validationResult.valid,
      totalRows: validationResult.totalRows,
      validRows: validationResult.validRows,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      headers: parseResult.headers,
      suggestedMapping,
      preview,
      deduplication: {
        newCompanies: newCompanyDomains.length,
        existingCompanies: existingOrgCompanies.length,
        newContacts: newContactEmails.length,
        existingContacts: existingOrgEmails.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error previewing CSV:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preview CSV' },
      { status: 500 }
    )
  }
}
