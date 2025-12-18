// CSV Import Utility Library
// Handles parsing, validation, and field mapping for CSV uploads

import Papa from 'papaparse'
import { createHash } from 'crypto'

// ============================================
// FIELD DEFINITIONS
// ============================================

export interface CSVFieldDefinition {
  key: string
  label: string
  required: boolean
  type: 'company' | 'contact'
  aliases: string[] // Common column names that map to this field
  validator?: (value: string) => { valid: boolean; error?: string }
  transformer?: (value: string) => string
}

export const CSV_FIELDS: CSVFieldDefinition[] = [
  // Company fields
  {
    key: 'companyName',
    label: 'Company Name',
    required: true,
    type: 'company',
    aliases: ['company name', 'company', 'organization', 'org', 'business name', 'account name'],
  },
  {
    key: 'companyDomain',
    label: 'Company Domain',
    required: false,
    type: 'company',
    aliases: ['domain', 'company domain', 'website', 'company website', 'url'],
    transformer: normalizeDomain,
  },
  {
    key: 'companyIndustry',
    label: 'Industry',
    required: false,
    type: 'company',
    aliases: ['industry', 'sector', 'company industry', 'vertical'],
  },
  {
    key: 'companySize',
    label: 'Company Size',
    required: false,
    type: 'company',
    aliases: ['company size', 'size', 'employees', 'employee count', 'headcount', 'num employees'],
  },
  {
    key: 'companyLocation',
    label: 'Company Location',
    required: false,
    type: 'company',
    aliases: ['company location', 'headquarters', 'hq', 'company address', 'company city'],
  },
  {
    key: 'companyLinkedinUrl',
    label: 'Company LinkedIn',
    required: false,
    type: 'company',
    aliases: ['company linkedin', 'company linkedin url', 'linkedin company'],
    validator: validateUrl,
  },
  {
    key: 'companyWebsiteUrl',
    label: 'Company Website',
    required: false,
    type: 'company',
    aliases: ['company website', 'website url'],
    validator: validateUrl,
    transformer: normalizeDomain,
  },
  // Contact fields
  {
    key: 'contactFirstName',
    label: 'First Name',
    required: true,
    type: 'contact',
    aliases: ['first name', 'firstname', 'first', 'given name'],
    transformer: capitalizeFirst,
  },
  {
    key: 'contactLastName',
    label: 'Last Name',
    required: true,
    type: 'contact',
    aliases: ['last name', 'lastname', 'last', 'surname', 'family name'],
    transformer: capitalizeFirst,
  },
  {
    key: 'contactEmail',
    label: 'Email',
    required: false,
    type: 'contact',
    aliases: ['email', 'email address', 'e-mail', 'contact email', 'work email'],
    validator: validateEmail,
    transformer: (v) => v.toLowerCase().trim(),
  },
  {
    key: 'contactPhone',
    label: 'Phone',
    required: false,
    type: 'contact',
    aliases: ['phone', 'phone number', 'telephone', 'mobile', 'cell', 'contact phone', 'work phone'],
    transformer: normalizePhone,
  },
  {
    key: 'contactJobTitle',
    label: 'Job Title',
    required: false,
    type: 'contact',
    aliases: ['job title', 'title', 'position', 'role', 'job', 'contact title'],
  },
  {
    key: 'contactLinkedinUrl',
    label: 'LinkedIn URL',
    required: false,
    type: 'contact',
    aliases: ['linkedin', 'linkedin url', 'linkedin profile', 'contact linkedin'],
    validator: validateUrl,
  },
  {
    key: 'contactLocation',
    label: 'Contact Location',
    required: false,
    type: 'contact',
    aliases: ['location', 'contact location', 'city', 'address'],
  },
  {
    key: 'contactSeniority',
    label: 'Seniority',
    required: false,
    type: 'contact',
    aliases: ['seniority', 'level', 'seniority level'],
  },
  {
    key: 'contactDepartment',
    label: 'Department',
    required: false,
    type: 'contact',
    aliases: ['department', 'dept', 'team', 'division'],
  },
]

// ============================================
// COLUMN MAPPING TYPES
// ============================================

export interface ColumnMapping {
  [fieldKey: string]: number | null // Maps field key to CSV column index
}

export interface ParsedRow {
  rowNumber: number
  companyName: string
  companyDomain: string | null
  companyIndustry: string | null
  companySize: string | null
  companyLocation: string | null
  companyLinkedinUrl: string | null
  companyWebsiteUrl: string | null
  contactFirstName: string
  contactLastName: string
  contactEmail: string | null
  contactPhone: string | null
  contactJobTitle: string | null
  contactLinkedinUrl: string | null
  contactLocation: string | null
  contactSeniority: string | null
  contactDepartment: string | null
}

export interface ValidationError {
  row: number
  field: string
  message: string
}

export interface ValidationWarning {
  row: number
  field: string
  message: string
}

export interface ParseResult {
  headers: string[]
  rows: string[][]
  totalRows: number
}

export interface ValidationResult {
  valid: boolean
  totalRows: number
  validRows: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
  parsedRows: ParsedRow[]
}

// ============================================
// TRANSFORMERS
// ============================================

function normalizeDomain(value: string): string {
  if (!value) return ''
  let domain = value.toLowerCase().trim()
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '')
  // Remove www.
  domain = domain.replace(/^www\./, '')
  // Remove trailing slash and path
  domain = domain.split('/')[0]
  return domain
}

function capitalizeFirst(value: string): string {
  if (!value) return ''
  return value.trim().charAt(0).toUpperCase() + value.trim().slice(1).toLowerCase()
}

function normalizePhone(value: string): string {
  if (!value) return ''
  // Keep only digits, +, and spaces for international format
  return value.replace(/[^\d+\s()-]/g, '').trim()
}

// ============================================
// VALIDATORS
// ============================================

function validateEmail(value: string): { valid: boolean; error?: string } {
  if (!value) return { valid: true } // Empty is valid (field is optional)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    return { valid: false, error: 'Invalid email format' }
  }
  return { valid: true }
}

function validateUrl(value: string): { valid: boolean; error?: string } {
  if (!value) return { valid: true } // Empty is valid
  // Basic URL validation - allows domain.com or full URLs
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i
  if (!urlRegex.test(value)) {
    return { valid: false, error: 'Invalid URL format' }
  }
  return { valid: true }
}

// ============================================
// CSV PARSING
// ============================================

export function parseCSV(csvContent: string): ParseResult {
  const result = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  })

  if (result.errors.length > 0) {
    throw new Error(`CSV parsing error: ${result.errors[0].message}`)
  }

  const rows = result.data
  if (rows.length === 0) {
    throw new Error('CSV file is empty')
  }

  const headers = rows[0]
  const dataRows = rows.slice(1)

  return {
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
  }
}

// ============================================
// AUTO-MAPPING
// ============================================

export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}

  // Initialize all fields as unmapped
  for (const field of CSV_FIELDS) {
    mapping[field.key] = null
  }

  // Try to match each header to a field
  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim()

    for (const field of CSV_FIELDS) {
      // Check if this field is already mapped
      if (mapping[field.key] !== null) continue

      // Check exact match with field label
      if (normalizedHeader === field.label.toLowerCase()) {
        mapping[field.key] = index
        break
      }

      // Check aliases
      if (field.aliases.some((alias) => normalizedHeader === alias)) {
        mapping[field.key] = index
        break
      }

      // Check partial match (header contains alias)
      if (field.aliases.some((alias) => normalizedHeader.includes(alias))) {
        mapping[field.key] = index
        break
      }
    }
  })

  return mapping
}

// ============================================
// VALIDATION
// ============================================

export function validateAndTransformRows(
  rows: string[][],
  mapping: ColumnMapping
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const parsedRows: ParsedRow[] = []
  let validRowCount = 0

  // Check required fields are mapped
  const requiredFields = CSV_FIELDS.filter((f) => f.required)
  for (const field of requiredFields) {
    if (mapping[field.key] === null || mapping[field.key] === undefined) {
      errors.push({
        row: 0,
        field: field.key,
        message: `Required field "${field.label}" is not mapped to any column`,
      })
    }
  }

  // If required fields are not mapped, return early
  if (errors.length > 0) {
    return {
      valid: false,
      totalRows: rows.length,
      validRows: 0,
      errors,
      warnings,
      parsedRows: [],
    }
  }

  // Process each row
  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2 // +2 because CSV is 1-indexed and we skip header
    const rowErrors: ValidationError[] = []
    const rowWarnings: ValidationWarning[] = []

    const parsedRow: ParsedRow = {
      rowNumber,
      companyName: '',
      companyDomain: null,
      companyIndustry: null,
      companySize: null,
      companyLocation: null,
      companyLinkedinUrl: null,
      companyWebsiteUrl: null,
      contactFirstName: '',
      contactLastName: '',
      contactEmail: null,
      contactPhone: null,
      contactJobTitle: null,
      contactLinkedinUrl: null,
      contactLocation: null,
      contactSeniority: null,
      contactDepartment: null,
    }

    // Extract and validate each field
    for (const field of CSV_FIELDS) {
      const colIndex = mapping[field.key]
      let value = colIndex !== null && colIndex !== undefined ? (row[colIndex] || '').trim() : ''

      // Apply transformer if present
      if (value && field.transformer) {
        value = field.transformer(value)
      }

      // Validate
      if (field.validator && value) {
        const validation = field.validator(value)
        if (!validation.valid) {
          rowWarnings.push({
            row: rowNumber,
            field: field.key,
            message: validation.error || 'Invalid value',
          })
        }
      }

      // Check required fields
      if (field.required && !value) {
        rowErrors.push({
          row: rowNumber,
          field: field.key,
          message: `Required field "${field.label}" is empty`,
        })
      }

      // Set value in parsed row
      ;(parsedRow as unknown as Record<string, string | null>)[field.key] = value || null
    }

    // Add row-level validation
    if (rowErrors.length === 0) {
      validRowCount++
      parsedRows.push(parsedRow)
    }

    errors.push(...rowErrors)
    warnings.push(...rowWarnings)
  })

  return {
    valid: errors.filter((e) => e.row !== 0).length === 0, // Exclude mapping errors from validity check
    totalRows: rows.length,
    validRows: validRowCount,
    errors,
    warnings,
    parsedRows,
  }
}

// ============================================
// GROUPING
// ============================================

export interface GroupedCompany {
  companyName: string
  companyDomain: string | null
  companyIndustry: string | null
  companySize: string | null
  companyLocation: string | null
  companyLinkedinUrl: string | null
  companyWebsiteUrl: string | null
  contacts: Array<{
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
    jobTitle: string | null
    linkedinUrl: string | null
    location: string | null
    seniority: string | null
    department: string | null
    rowNumber: number
  }>
}

export function groupByCompany(parsedRows: ParsedRow[]): GroupedCompany[] {
  const companyMap = new Map<string, GroupedCompany>()

  for (const row of parsedRows) {
    // Use domain as key if available, otherwise use company name
    const key = row.companyDomain?.toLowerCase() || row.companyName.toLowerCase()

    let company = companyMap.get(key)
    if (!company) {
      company = {
        companyName: row.companyName,
        companyDomain: row.companyDomain,
        companyIndustry: row.companyIndustry,
        companySize: row.companySize,
        companyLocation: row.companyLocation,
        companyLinkedinUrl: row.companyLinkedinUrl,
        companyWebsiteUrl: row.companyWebsiteUrl,
        contacts: [],
      }
      companyMap.set(key, company)
    }

    company.contacts.push({
      firstName: row.contactFirstName,
      lastName: row.contactLastName,
      email: row.contactEmail,
      phone: row.contactPhone,
      jobTitle: row.contactJobTitle,
      linkedinUrl: row.contactLinkedinUrl,
      location: row.contactLocation,
      seniority: row.contactSeniority,
      department: row.contactDepartment,
      rowNumber: row.rowNumber,
    })
  }

  return Array.from(companyMap.values())
}

// ============================================
// ID GENERATION
// ============================================

export function generateCsvImportId(email: string): string {
  const hash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
  return `csv_import_${hash.substring(0, 24)}`
}

export function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// ============================================
// METADATA HELPERS
// ============================================

export interface CSVImportMetadata {
  source: 'csv_import'
  uploadId: string
  uploadedAt: string
  uploadedBy: string
  originalFileName: string
  rowNumber?: number
  [key: string]: unknown // Index signature for Record<string, unknown> compatibility
}

export function createImportMetadata(
  uploadId: string,
  userId: string,
  fileName: string,
  rowNumber?: number
): CSVImportMetadata {
  return {
    source: 'csv_import',
    uploadId,
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
    originalFileName: fileName,
    ...(rowNumber !== undefined && { rowNumber }),
  }
}

// ============================================
// CSV TEMPLATE
// ============================================

export const CSV_TEMPLATE_HEADERS = [
  'Company Name',
  'Company Domain',
  'Industry',
  'Company Size',
  'Company Location',
  'First Name',
  'Last Name',
  'Email',
  'Phone',
  'Job Title',
  'LinkedIn URL',
]

export const CSV_TEMPLATE_EXAMPLE_ROWS = [
  [
    'Acme Inc',
    'acme.com',
    'Technology',
    '50-200',
    'San Francisco, CA',
    'John',
    'Smith',
    'john@acme.com',
    '+1-555-0123',
    'VP of Sales',
    'https://linkedin.com/in/johnsmith',
  ],
  [
    'Acme Inc',
    'acme.com',
    'Technology',
    '50-200',
    'San Francisco, CA',
    'Jane',
    'Doe',
    'jane@acme.com',
    '',
    'CTO',
    'https://linkedin.com/in/janedoe',
  ],
  [
    'Beta Corp',
    'beta.io',
    'Finance',
    '200-500',
    'New York, NY',
    'Bob',
    'Wilson',
    'bob@beta.io',
    '+1-555-0456',
    'Director of Engineering',
    '',
  ],
]

export function generateCSVTemplate(): string {
  const rows = [CSV_TEMPLATE_HEADERS, ...CSV_TEMPLATE_EXAMPLE_ROWS]
  return Papa.unparse(rows)
}
