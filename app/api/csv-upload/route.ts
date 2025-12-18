import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  companies,
  employees,
  globalCompanies,
  globalEmployees,
} from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import {
  parseCSV,
  validateAndTransformRows,
  groupByCompany,
  generateCsvImportId,
  generateUploadId,
  createImportMetadata,
  type ColumnMapping,
  type GroupedCompany,
} from '@/lib/csv-import'

export interface UploadRequest {
  csvContent: string
  columnMapping: ColumnMapping
  fileName: string
  options: {
    updateExisting: boolean
    enrichWithApollo: boolean
  }
}

export interface UploadResponse {
  success: boolean
  uploadId: string
  stats: {
    companiesCreated: number
    companiesUpdated: number
    companiesSkipped: number
    contactsCreated: number
    contactsUpdated: number
    contactsSkipped: number
    globalCompaniesCreated: number
    globalContactsCreated: number
  }
  errors: Array<{ row: number; message: string }>
  enrichmentQueued: boolean
}

// POST /api/csv-upload - Process and persist CSV data
export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireOrgAuth()
    const body: UploadRequest = await req.json()

    if (!body.csvContent || !body.columnMapping) {
      return NextResponse.json(
        { error: 'CSV content and column mapping are required' },
        { status: 400 }
      )
    }

    const uploadId = generateUploadId()
    const fileName = body.fileName || 'unknown.csv'
    const { updateExisting } = body.options

    // Parse and validate
    const parseResult = parseCSV(body.csvContent)
    const validationResult = validateAndTransformRows(
      parseResult.rows,
      body.columnMapping
    )

    if (!validationResult.valid || validationResult.parsedRows.length === 0) {
      return NextResponse.json(
        {
          error: 'CSV validation failed',
          errors: validationResult.errors,
        },
        { status: 400 }
      )
    }

    // Group by company
    const groupedCompanies = groupByCompany(validationResult.parsedRows)

    // Initialize stats
    const stats = {
      companiesCreated: 0,
      companiesUpdated: 0,
      companiesSkipped: 0,
      contactsCreated: 0,
      contactsUpdated: 0,
      contactsSkipped: 0,
      globalCompaniesCreated: 0,
      globalContactsCreated: 0,
    }
    const errors: Array<{ row: number; message: string }> = []

    // Process each company and its contacts
    for (const groupedCompany of groupedCompanies) {
      try {
        const result = await processCompanyWithContacts(
          groupedCompany,
          orgId,
          userId,
          uploadId,
          fileName,
          updateExisting
        )

        stats.companiesCreated += result.companyCreated ? 1 : 0
        stats.companiesUpdated += result.companyUpdated ? 1 : 0
        stats.companiesSkipped += result.companySkipped ? 1 : 0
        stats.contactsCreated += result.contactsCreated
        stats.contactsUpdated += result.contactsUpdated
        stats.contactsSkipped += result.contactsSkipped
        stats.globalCompaniesCreated += result.globalCompanyCreated ? 1 : 0
        stats.globalContactsCreated += result.globalContactsCreated

        errors.push(...result.errors)
      } catch (error) {
        console.error(`Error processing company ${groupedCompany.companyName}:`, error)
        errors.push({
          row: groupedCompany.contacts[0]?.rowNumber || 0,
          message: `Failed to process company: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }

    const response: UploadResponse = {
      success: errors.length === 0,
      uploadId,
      stats,
      errors,
      enrichmentQueued: body.options.enrichWithApollo,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error uploading CSV:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload CSV' },
      { status: 500 }
    )
  }
}

interface ProcessResult {
  companyCreated: boolean
  companyUpdated: boolean
  companySkipped: boolean
  companyId: string | null
  contactsCreated: number
  contactsUpdated: number
  contactsSkipped: number
  globalCompanyCreated: boolean
  globalContactsCreated: number
  errors: Array<{ row: number; message: string }>
}

async function processCompanyWithContacts(
  groupedCompany: GroupedCompany,
  orgId: string,
  userId: string,
  uploadId: string,
  fileName: string,
  updateExisting: boolean
): Promise<ProcessResult> {
  const result: ProcessResult = {
    companyCreated: false,
    companyUpdated: false,
    companySkipped: false,
    companyId: null,
    contactsCreated: 0,
    contactsUpdated: 0,
    contactsSkipped: 0,
    globalCompanyCreated: false,
    globalContactsCreated: 0,
    errors: [],
  }

  const domain = groupedCompany.companyDomain?.toLowerCase() || null

  // 1. Process Global Company (if domain exists)
  if (domain) {
    const existingGlobal = await db.query.globalCompanies.findFirst({
      where: eq(globalCompanies.domain, domain),
    })

    if (!existingGlobal) {
      // Create new global company
      await db.insert(globalCompanies).values({
        domain,
        name: groupedCompany.companyName,
        industry: groupedCompany.companyIndustry,
        size: groupedCompany.companySize,
        location: groupedCompany.companyLocation,
        linkedinUrl: groupedCompany.companyLinkedinUrl,
        websiteUrl: groupedCompany.companyWebsiteUrl,
        enrichmentSource: 'csv_import',
        metadata: {
          source: 'csv_import',
          uploadId,
        },
      })
      result.globalCompanyCreated = true
    } else if (updateExisting) {
      // Update existing global company
      await db
        .update(globalCompanies)
        .set({
          name: groupedCompany.companyName,
          industry: groupedCompany.companyIndustry || existingGlobal.industry,
          size: groupedCompany.companySize || existingGlobal.size,
          location: groupedCompany.companyLocation || existingGlobal.location,
          linkedinUrl: groupedCompany.companyLinkedinUrl || existingGlobal.linkedinUrl,
          websiteUrl: groupedCompany.companyWebsiteUrl || existingGlobal.websiteUrl,
          updatedAt: new Date(),
        })
        .where(eq(globalCompanies.domain, domain))
    }
  }

  // 2. Process Org Company
  let orgCompany = domain
    ? await db.query.companies.findFirst({
        where: and(eq(companies.orgId, orgId), eq(companies.domain, domain)),
      })
    : await db.query.companies.findFirst({
        where: and(
          eq(companies.orgId, orgId),
          eq(companies.name, groupedCompany.companyName)
        ),
      })

  const companyMetadata = createImportMetadata(uploadId, userId, fileName)

  if (!orgCompany) {
    // Create new org company
    const [newCompany] = await db
      .insert(companies)
      .values({
        orgId,
        name: groupedCompany.companyName,
        domain,
        industry: groupedCompany.companyIndustry,
        size: groupedCompany.companySize,
        location: groupedCompany.companyLocation,
        linkedinUrl: groupedCompany.companyLinkedinUrl,
        websiteUrl: groupedCompany.companyWebsiteUrl,
        metadata: companyMetadata,
      })
      .returning()

    orgCompany = newCompany
    result.companyCreated = true
    result.companyId = newCompany.id
  } else if (updateExisting) {
    // Update existing org company
    await db
      .update(companies)
      .set({
        industry: groupedCompany.companyIndustry || orgCompany.industry,
        size: groupedCompany.companySize || orgCompany.size,
        location: groupedCompany.companyLocation || orgCompany.location,
        linkedinUrl: groupedCompany.companyLinkedinUrl || orgCompany.linkedinUrl,
        websiteUrl: groupedCompany.companyWebsiteUrl || orgCompany.websiteUrl,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, orgCompany.id))

    result.companyUpdated = true
    result.companyId = orgCompany.id
  } else {
    result.companySkipped = true
    result.companyId = orgCompany.id
  }

  // 3. Process Contacts
  for (const contact of groupedCompany.contacts) {
    try {
      const contactResult = await processContact(
        contact,
        orgId,
        userId,
        result.companyId!,
        domain,
        uploadId,
        fileName,
        updateExisting
      )

      result.contactsCreated += contactResult.created ? 1 : 0
      result.contactsUpdated += contactResult.updated ? 1 : 0
      result.contactsSkipped += contactResult.skipped ? 1 : 0
      result.globalContactsCreated += contactResult.globalCreated ? 1 : 0
    } catch (error) {
      result.errors.push({
        row: contact.rowNumber,
        message: `Failed to process contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  return result
}

interface ContactResult {
  created: boolean
  updated: boolean
  skipped: boolean
  globalCreated: boolean
}

async function processContact(
  contact: GroupedCompany['contacts'][0],
  orgId: string,
  userId: string,
  companyId: string,
  companyDomain: string | null,
  uploadId: string,
  fileName: string,
  updateExisting: boolean
): Promise<ContactResult> {
  const result: ContactResult = {
    created: false,
    updated: false,
    skipped: false,
    globalCreated: false,
  }

  const email = contact.email?.toLowerCase() || null

  // 1. Process Global Employee (if email exists and domain exists)
  if (email && companyDomain) {
    const syntheticApolloId = generateCsvImportId(email)

    const existingGlobal = await db.query.globalEmployees.findFirst({
      where: eq(globalEmployees.apolloId, syntheticApolloId),
    })

    if (!existingGlobal) {
      // Create new global employee
      await db.insert(globalEmployees).values({
        apolloId: syntheticApolloId,
        companyDomain,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email,
        phone: contact.phone,
        jobTitle: contact.jobTitle,
        linkedinUrl: contact.linkedinUrl,
        location: contact.location,
        seniority: contact.seniority,
        department: contact.department,
        metadata: {
          departments: contact.department ? [contact.department] : undefined,
        },
        fetchedAt: new Date(),
      })
      result.globalCreated = true
    } else if (updateExisting) {
      // Update existing global employee
      await db
        .update(globalEmployees)
        .set({
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone || existingGlobal.phone,
          jobTitle: contact.jobTitle || existingGlobal.jobTitle,
          linkedinUrl: contact.linkedinUrl || existingGlobal.linkedinUrl,
          location: contact.location || existingGlobal.location,
          seniority: contact.seniority || existingGlobal.seniority,
          department: contact.department || existingGlobal.department,
          updatedAt: new Date(),
        })
        .where(eq(globalEmployees.apolloId, syntheticApolloId))
    }
  }

  // 2. Process Org Employee
  const contactMetadata = createImportMetadata(uploadId, userId, fileName, contact.rowNumber)

  // Check if employee exists (by email if available, otherwise by name + company)
  const existingEmployee = email
    ? await db.query.employees.findFirst({
        where: and(
          eq(employees.orgId, orgId),
          eq(employees.companyId, companyId),
          eq(employees.email, email)
        ),
      })
    : await db.query.employees.findFirst({
        where: and(
          eq(employees.orgId, orgId),
          eq(employees.companyId, companyId),
          eq(employees.firstName, contact.firstName),
          eq(employees.lastName, contact.lastName)
        ),
      })

  if (!existingEmployee) {
    // Create new org employee
    const apolloId = email ? generateCsvImportId(email) : null

    await db.insert(employees).values({
      orgId,
      companyId,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email,
      phone: contact.phone,
      jobTitle: contact.jobTitle,
      linkedinUrl: contact.linkedinUrl,
      location: contact.location,
      seniority: contact.seniority,
      department: contact.department,
      apolloId,
      metadata: {
        ...contactMetadata,
        source: 'csv_import',
      },
    })
    result.created = true
  } else if (updateExisting) {
    // Update existing org employee
    await db
      .update(employees)
      .set({
        email: email || existingEmployee.email,
        phone: contact.phone || existingEmployee.phone,
        jobTitle: contact.jobTitle || existingEmployee.jobTitle,
        linkedinUrl: contact.linkedinUrl || existingEmployee.linkedinUrl,
        location: contact.location || existingEmployee.location,
        seniority: contact.seniority || existingEmployee.seniority,
        department: contact.department || existingEmployee.department,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, existingEmployee.id))
    result.updated = true
  } else {
    result.skipped = true
  }

  return result
}
