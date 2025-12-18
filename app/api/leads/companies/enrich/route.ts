import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  companies,
  employees,
  leads,
  organizations,
  enrichmentTransactions,
} from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { getOrFetchEmployees, getCacheStats, type EnrichmentFilters } from '@/lib/employee-cache'
import { bulkEnrichPeople } from '@/lib/apollo'

interface EnrichResult {
  companyId: string
  companyName: string
  employeesFound: number
  employeesCreated: number
  leadsCreated: number
  cacheHit: boolean
  error?: string
}

interface CacheStatus {
  exists: boolean
  employeesCount: number
  isStale: boolean
  lastFetchedAt: Date | null
}

// POST /api/leads/companies/enrich - Enrich companies from leads with employees
export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireOrgAuth()

    const body = await req.json().catch(() => ({}))
    const {
      companyIds,
      filters,
      fetchAll = false,
      revealPhoneNumbers = false,
      searchId,
    }: {
      companyIds?: string[]
      filters?: EnrichmentFilters
      fetchAll?: boolean
      revealPhoneNumbers?: boolean
      searchId?: string
    } = body

    // Get companies to enrich
    // If companyIds provided, use those. Otherwise, get all companies that have leads
    let companiesToEnrich
    if (companyIds && companyIds.length > 0) {
      companiesToEnrich = await db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          inArray(companies.id, companyIds)
        ),
      })
    } else {
      // Get all unique company IDs from leads
      const leadsWithCompanies = await db
        .selectDistinct({ companyId: leads.companyId })
        .from(leads)
        .where(and(eq(leads.orgId, orgId), sql`${leads.companyId} IS NOT NULL`))

      const leadCompanyIds = leadsWithCompanies
        .map((l) => l.companyId)
        .filter((id): id is string => id !== null)

      if (leadCompanyIds.length === 0) {
        return NextResponse.json(
          { error: 'No companies with leads found to enrich' },
          { status: 400 }
        )
      }

      companiesToEnrich = await db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          inArray(companies.id, leadCompanyIds)
        ),
      })
    }

    if (companiesToEnrich.length === 0) {
      return NextResponse.json(
        { error: 'No companies found to enrich' },
        { status: 400 }
      )
    }

    // Filter to only companies with domains
    const companiesWithDomains = companiesToEnrich.filter((c) => c.domain)
    const companiesWithoutDomains = companiesToEnrich.filter((c) => !c.domain)

    console.log(
      `[Leads Enrich] Processing ${companiesWithDomains.length} companies with domains, ${companiesWithoutDomains.length} without (fetchAll: ${fetchAll})`
    )

    // Get org credit info
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    let creditsRemaining = (org.creditsLimit || 30) - (org.creditsUsed || 0)
    let totalCreditsUsed = 0
    let totalEmployeesFound = 0
    let totalEmployeesCreated = 0
    let totalLeadsCreated = 0
    let cacheHits = 0
    let apolloFetches = 0

    const results: EnrichResult[] = []
    const errors: string[] = []
    const leadsForPhoneEnrichment: Array<{ id: string; apolloId: string }> = []

    // Process each company
    for (const company of companiesWithDomains) {
      try {
        console.log(`[Leads Enrich] Processing: ${company.name} (${company.domain})`)

        // Step 1: Get employees from global cache (basic info with Apollo IDs)
        const {
          employees: globalEmployeesResult,
          cacheHit,
          totalAvailable,
        } = await getOrFetchEmployees(
          company.domain!,
          company.name,
          company.linkedinUrl || undefined,
          filters,
          false, // Don't force refresh for bulk operations
          fetchAll // Pass through fetchAll to get ALL employees
        )

        if (cacheHit) {
          cacheHits++
        } else {
          apolloFetches++
        }

        totalEmployeesFound += totalAvailable

        if (globalEmployeesResult.length === 0) {
          console.log(`[Leads Enrich] No employees found for ${company.name}`)
          results.push({
            companyId: company.id,
            companyName: company.name,
            employeesFound: 0,
            employeesCreated: 0,
            leadsCreated: 0,
            cacheHit,
          })
          continue
        }

        // Step 2: Call bulkEnrichPeople to get actual emails
        // Collect Apollo IDs from employees that need enrichment
        const apolloIdsToEnrich = globalEmployeesResult
          .filter(emp => emp.apolloId && !emp.email) // Only enrich those without emails
          .map(emp => emp.apolloId!)

        // Create a map for quick lookup of enriched data
        const enrichedDataMap = new Map<string, { email: string | null; phone: string | null }>()

        if (apolloIdsToEnrich.length > 0) {
          console.log(`[Leads Enrich] Enriching ${apolloIdsToEnrich.length} contacts for ${company.name} to get emails`)

          try {
            // Get the webhook URL for phone enrichment if requested
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
            const webhookUrl = revealPhoneNumbers && baseUrl
              ? `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/webhooks/apollo/phones`
              : undefined

            // Call Apollo bulk_match to get emails (and optionally phone numbers)
            const enrichedPeople = await bulkEnrichPeople({
              apolloIds: apolloIdsToEnrich,
              revealPhoneNumber: revealPhoneNumbers,
              webhookUrl,
            })

            // Build lookup map from enriched results
            for (const person of enrichedPeople) {
              if (person.apolloId) {
                enrichedDataMap.set(person.apolloId, {
                  email: person.email,
                  phone: person.phone,
                })
              }
            }

            console.log(`[Leads Enrich] Enriched ${enrichedPeople.length} contacts with emails`)
          } catch (enrichError) {
            console.error(`[Leads Enrich] Error enriching contacts for ${company.name}:`, enrichError)
            // Continue with what we have - some contacts may not have emails
          }
        }

        // Step 3: Create employees and leads with enriched data
        let employeesCreated = 0
        let leadsCreated = 0

        for (const globalEmployee of globalEmployeesResult) {
          try {
            // Get enriched data if available
            const enrichedData = globalEmployee.apolloId
              ? enrichedDataMap.get(globalEmployee.apolloId)
              : null

            // Use enriched email if available, otherwise use cached email
            const email = enrichedData?.email || globalEmployee.email || null
            const phone = enrichedData?.phone || globalEmployee.phone || null

            // Check if employee already exists for this company
            const existingEmployee = await db.query.employees.findFirst({
              where: and(
                eq(employees.orgId, orgId),
                eq(employees.companyId, company.id),
                eq(employees.apolloId, globalEmployee.apolloId)
              ),
            })

            let employeeId: string

            if (existingEmployee) {
              employeeId = existingEmployee.id
              // Update existing employee with new enriched data
              if (email || phone) {
                await db.update(employees)
                  .set({
                    email: email || existingEmployee.email,
                    phone: phone || existingEmployee.phone,
                    updatedAt: new Date(),
                  })
                  .where(eq(employees.id, existingEmployee.id))
              }
            } else {
              // Create employee record with enriched data
              const [newEmployee] = await db.insert(employees).values({
                orgId,
                companyId: company.id,
                firstName: globalEmployee.firstName,
                lastName: globalEmployee.lastName,
                email,
                phone,
                jobTitle: globalEmployee.jobTitle,
                linkedinUrl: globalEmployee.linkedinUrl,
                location: globalEmployee.location,
                seniority: globalEmployee.seniority,
                department: globalEmployee.department,
                apolloId: globalEmployee.apolloId,
                isShortlisted: true, // Mark as shortlisted since we're creating a lead
                metadata: {
                  source: 'global_cache',
                  globalEmployeeId: globalEmployee.id,
                  departments: globalEmployee.metadata?.departments,
                  enrichedAt: new Date().toISOString(),
                  cacheHit,
                  fetchAll,
                },
              }).returning()

              employeeId = newEmployee.id
              employeesCreated++
            }

            // Check if lead already exists for this employee
            const existingLead = await db.query.leads.findFirst({
              where: and(
                eq(leads.orgId, orgId),
                eq(leads.employeeId, employeeId)
              ),
            })

            if (!existingLead) {
              // Create lead record with enriched data
              const phonePending = revealPhoneNumbers && !phone
              const [newLead] = await db.insert(leads).values({
                orgId,
                companyId: company.id,
                employeeId,
                searchId: searchId || null,
                firstName: globalEmployee.firstName,
                lastName: globalEmployee.lastName,
                email,
                phone,
                jobTitle: globalEmployee.jobTitle,
                linkedinUrl: globalEmployee.linkedinUrl,
                location: globalEmployee.location,
                status: 'new',
                metadata: {
                  apolloId: globalEmployee.apolloId,
                  seniority: globalEmployee.seniority,
                  department: globalEmployee.department,
                  departments: globalEmployee.metadata?.departments,
                  source: 'enrichment',
                  enrichedAt: new Date().toISOString(),
                  phonePending,
                },
              }).returning()

              leadsCreated++

              // Track leads waiting for phone numbers via webhook
              if (phonePending && globalEmployee.apolloId) {
                leadsForPhoneEnrichment.push({
                  id: newLead.id,
                  apolloId: globalEmployee.apolloId,
                })
              }
            }
          } catch (err) {
            // Ignore duplicate errors
            console.error('[Leads Enrich] Error creating employee/lead:', err)
          }
        }

        // Update credits
        creditsRemaining -= leadsCreated
        totalCreditsUsed += leadsCreated
        totalEmployeesCreated += employeesCreated
        totalLeadsCreated += leadsCreated

        // Mark company as enriched
        await db
          .update(companies)
          .set({
            isEnriched: true,
            enrichedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(companies.id, company.id))

        results.push({
          companyId: company.id,
          companyName: company.name,
          employeesFound: globalEmployeesResult.length,
          employeesCreated,
          leadsCreated,
          cacheHit,
        })

        console.log(
          `[Leads Enrich] ${company.name}: ${employeesCreated} employees, ${leadsCreated} leads created (cache hit: ${cacheHit}, fetchAll: ${fetchAll})`
        )

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[Leads Enrich] Error processing ${company.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${company.name}: ${errorMessage}`)
        results.push({
          companyId: company.id,
          companyName: company.name,
          employeesFound: 0,
          employeesCreated: 0,
          leadsCreated: 0,
          cacheHit: false,
          error: errorMessage,
        })
      }
    }

    // Phone enrichment is now done inline during bulkEnrichPeople calls
    // leadsForPhoneEnrichment tracks leads waiting for phone numbers via webhook
    const phoneEnrichmentStarted = revealPhoneNumbers && leadsForPhoneEnrichment.length > 0

    // Update org credits in one operation
    if (totalCreditsUsed > 0) {
      await db
        .update(organizations)
        .set({
          creditsUsed: sql`${organizations.creditsUsed} + ${totalCreditsUsed}`,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, orgId))
    }

    // Log transaction
    await db.insert(enrichmentTransactions).values({
      orgId,
      userId,
      transactionType: 'leads_company_enrich',
      creditsUsed: totalCreditsUsed,
      employeeCount: totalEmployeesCreated,
      cacheHit: cacheHits > apolloFetches,
      apolloCallsMade: apolloFetches,
      metadata: {
        filters,
        fetchAll,
        companyIds: companiesToEnrich.map((c) => c.id),
      },
    })

    console.log(
      `[Leads Enrich] Completed: ${totalEmployeesCreated} employees, ${totalLeadsCreated} leads, ${totalCreditsUsed} credits, ${cacheHits} cache hits, ${apolloFetches} Apollo fetches`
    )

    return NextResponse.json({
      success: true,
      companiesProcessed: companiesWithDomains.length,
      companiesSkipped: companiesWithoutDomains.length,
      totalEmployeesFound,
      totalEmployeesCreated,
      totalLeadsCreated,
      totalCreditsUsed,
      cacheHits,
      apolloFetches,
      phoneEnrichment: revealPhoneNumbers ? {
        requested: true,
        leadsQueued: leadsForPhoneEnrichment.length,
        started: phoneEnrichmentStarted,
      } : undefined,
      results,
      errors: errors.length > 0 ? errors : undefined,
      skippedCompanies:
        companiesWithoutDomains.length > 0
          ? companiesWithoutDomains.map((c) => ({
              id: c.id,
              name: c.name,
              reason: 'No domain available',
            }))
          : undefined,
    })
  } catch (error) {
    console.error('[Leads Enrich] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to enrich companies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/leads/companies/enrich - Get enrichment preview for companies
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth()
    const { searchParams } = new URL(req.url)
    const companyIdsParam = searchParams.get('companyIds')
    const companyIds = companyIdsParam ? companyIdsParam.split(',') : []

    // Get companies
    let targetCompanies
    if (companyIds.length > 0) {
      targetCompanies = await db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          inArray(companies.id, companyIds)
        ),
      })
    } else {
      // Get all unique company IDs from leads
      const leadsWithCompanies = await db
        .selectDistinct({ companyId: leads.companyId })
        .from(leads)
        .where(and(eq(leads.orgId, orgId), sql`${leads.companyId} IS NOT NULL`))

      const leadCompanyIds = leadsWithCompanies
        .map((l) => l.companyId)
        .filter((id): id is string => id !== null)

      targetCompanies = await db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          inArray(companies.id, leadCompanyIds)
        ),
      })
    }

    const companiesWithDomains = targetCompanies.filter((c) => c.domain)
    const companiesWithoutDomains = targetCompanies.filter((c) => !c.domain)

    // Check cache status for each company with domain
    const companyStatuses: Array<{
      id: string
      name: string
      domain: string | null
      hasDomain: boolean
      isEnriched: boolean
      cacheStatus: CacheStatus | null
      orgEmployeesCount: number
    }> = []

    let totalEstimatedEmployees = 0
    let companiesInCache = 0
    let companiesNeedingFetch = 0

    for (const company of targetCompanies) {
      // Get count of existing employees for this company in org
      const [{ count: orgEmployeesCount }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(employees)
        .where(and(eq(employees.orgId, orgId), eq(employees.companyId, company.id)))

      let cacheStatus: CacheStatus | null = null

      if (company.domain) {
        const stats = await getCacheStats(company.domain)
        cacheStatus = {
          exists: stats.exists,
          employeesCount: stats.employeesCount,
          isStale: stats.isStale,
          lastFetchedAt: stats.lastFetchedAt,
        }

        if (stats.exists) {
          companiesInCache++
          totalEstimatedEmployees += stats.employeesCount
        } else {
          companiesNeedingFetch++
        }
      }

      companyStatuses.push({
        id: company.id,
        name: company.name,
        domain: company.domain,
        hasDomain: !!company.domain,
        isEnriched: company.isEnriched || false,
        cacheStatus,
        orgEmployeesCount: Number(orgEmployeesCount),
      })
    }

    // Get org credit info
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    return NextResponse.json({
      companies: companyStatuses,
      totals: {
        totalCompanies: targetCompanies.length,
        companiesWithDomains: companiesWithDomains.length,
        companiesWithoutDomains: companiesWithoutDomains.length,
        companiesInCache,
        companiesNeedingFetch,
        estimatedEmployeesInCache: totalEstimatedEmployees,
      },
      creditsRemaining: (org?.creditsLimit || 30) - (org?.creditsUsed || 0),
    })
  } catch (error) {
    console.error('[Leads Enrich] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to get enrichment preview' },
      { status: 500 }
    )
  }
}
