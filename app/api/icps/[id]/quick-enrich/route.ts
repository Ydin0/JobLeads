import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  companies,
  employees,
  organizations,
  enrichmentTransactions,
  searches,
} from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { getOrFetchEmployees, type EnrichmentFilters } from '@/lib/employee-cache'

type RouteContext = { params: Promise<{ id: string }> }

interface QuickEnrichResult {
  companyId: string
  companyName: string
  employeesFound: number
  employeesCreated: number
  cacheHit: boolean
  error?: string
}

// POST /api/icps/[id]/quick-enrich - Bulk enrich all companies in an ICP
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { orgId, userId } = await requireOrgAuth()
    const { id: icpId } = await params

    // Get options from request body
    const body = await req.json().catch(() => ({}))
    const {
      companyIds,
      filters,
      saveFilters = true,
      fetchAll = false,
    }: {
      companyIds?: string[]
      filters?: EnrichmentFilters
      saveFilters?: boolean
      fetchAll?: boolean
    } = body

    // Verify ICP exists and belongs to org
    const icp = await db.query.searches.findFirst({
      where: and(eq(searches.id, icpId), eq(searches.orgId, orgId)),
    })

    if (!icp) {
      return NextResponse.json({ error: 'ICP not found' }, { status: 404 })
    }

    // Get companies to enrich
    let companiesToEnrich
    if (companyIds && companyIds.length > 0) {
      // Enrich specific companies
      companiesToEnrich = await db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          eq(companies.searchId, icpId),
          inArray(companies.id, companyIds)
        ),
      })
    } else {
      // Enrich all companies in the ICP
      companiesToEnrich = await db.query.companies.findMany({
        where: and(eq(companies.orgId, orgId), eq(companies.searchId, icpId)),
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
      `[Quick Enrich] Processing ${companiesWithDomains.length} companies with domains, ${companiesWithoutDomains.length} without (fetchAll: ${fetchAll})`
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
    let cacheHits = 0
    let apolloFetches = 0

    const results: QuickEnrichResult[] = []
    const errors: string[] = []

    // Process each company
    for (const company of companiesWithDomains) {
      try {
        console.log(`[Quick Enrich] Processing: ${company.name} (${company.domain})`)

        // Use cache-first approach
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

        // Check if we have enough credits
        const employeesToCreate = globalEmployeesResult.length
        if (employeesToCreate > creditsRemaining) {
          console.log(
            `[Quick Enrich] Insufficient credits for ${company.name}. Need ${employeesToCreate}, have ${creditsRemaining}`
          )
          results.push({
            companyId: company.id,
            companyName: company.name,
            employeesFound: globalEmployeesResult.length,
            employeesCreated: 0,
            cacheHit,
            error: `Insufficient credits (need ${employeesToCreate}, have ${creditsRemaining})`,
          })
          continue
        }

        // Copy employees to org
        let employeesCreated = 0
        const globalEmployeeIds: string[] = []

        for (const globalEmployee of globalEmployeesResult) {
          try {
            await db
              .insert(employees)
              .values({
                orgId,
                companyId: company.id,
                firstName: globalEmployee.firstName,
                lastName: globalEmployee.lastName,
                email: globalEmployee.email,
                phone: globalEmployee.phone,
                jobTitle: globalEmployee.jobTitle,
                linkedinUrl: globalEmployee.linkedinUrl,
                location: globalEmployee.location,
                seniority: globalEmployee.seniority,
                department: globalEmployee.department,
                apolloId: globalEmployee.apolloId,
                isShortlisted: false,
                metadata: {
                  source: 'global_cache',
                  globalEmployeeId: globalEmployee.id,
                  departments: globalEmployee.metadata?.departments,
                  enrichedAt: new Date().toISOString(),
                  cacheHit,
                  fetchAll,
                  icpId,
                },
              })
              .onConflictDoNothing()

            employeesCreated++
            globalEmployeeIds.push(globalEmployee.id)
          } catch (err) {
            // Ignore duplicate errors
          }
        }

        // Update credits
        creditsRemaining -= employeesCreated
        totalCreditsUsed += employeesCreated
        totalEmployeesFound += globalEmployeesResult.length
        totalEmployeesCreated += employeesCreated

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
          cacheHit,
        })

        console.log(
          `[Quick Enrich] ${company.name}: ${employeesCreated} employees created (cache hit: ${cacheHit}, fetchAll: ${fetchAll})`
        )

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`[Quick Enrich] Error processing ${company.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${company.name}: ${errorMessage}`)
        results.push({
          companyId: company.id,
          companyName: company.name,
          employeesFound: 0,
          employeesCreated: 0,
          cacheHit: false,
          error: errorMessage,
        })
      }
    }

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

    // Log bulk transaction
    await db.insert(enrichmentTransactions).values({
      orgId,
      userId,
      transactionType: 'bulk_enrich',
      creditsUsed: totalCreditsUsed,
      searchId: icpId,
      employeeCount: totalEmployeesCreated,
      cacheHit: cacheHits > apolloFetches,
      apolloCallsMade: apolloFetches,
      metadata: {
        filters,
        fetchAll,
      },
    })

    // Save filters to ICP if requested
    if (saveFilters && filters) {
      const currentFilters = (icp.filters || {}) as Record<string, unknown>
      await db
        .update(searches)
        .set({
          filters: {
            ...currentFilters,
            enrichmentFilters: {
              decisionMakerTitles: filters.titles || [],
              decisionMakerSeniorities: filters.seniorities || [],
              lastUsedAt: new Date().toISOString(),
            },
          },
          updatedAt: new Date(),
        })
        .where(eq(searches.id, icpId))
    }

    console.log(
      `[Quick Enrich] Completed: ${totalEmployeesCreated} employees, ${totalCreditsUsed} credits, ${cacheHits} cache hits, ${apolloFetches} Apollo fetches`
    )

    return NextResponse.json({
      success: true,
      companiesProcessed: companiesWithDomains.length,
      companiesSkipped: companiesWithoutDomains.length,
      totalEmployeesFound,
      totalEmployeesCreated,
      totalCreditsUsed,
      cacheHits,
      apolloFetches,
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
    console.error('[Quick Enrich] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to perform quick enrich',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/icps/[id]/quick-enrich - Get enrichment preview (estimated credits, cache status)
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth()
    const { id: icpId } = await params

    // Verify ICP exists
    const icp = await db.query.searches.findFirst({
      where: and(eq(searches.id, icpId), eq(searches.orgId, orgId)),
    })

    if (!icp) {
      return NextResponse.json({ error: 'ICP not found' }, { status: 404 })
    }

    // Get companies in this ICP
    const icpCompanies = await db.query.companies.findMany({
      where: and(eq(companies.orgId, orgId), eq(companies.searchId, icpId)),
    })

    const companiesWithDomains = icpCompanies.filter((c) => c.domain)
    const companiesWithoutDomains = icpCompanies.filter((c) => !c.domain)
    const enrichedCompanies = icpCompanies.filter((c) => c.isEnriched)
    const unenrichedCompanies = companiesWithDomains.filter((c) => !c.isEnriched)

    // Check cache status for unenriched companies
    const { getCacheStats } = await import('@/lib/employee-cache')
    let totalCachedEmployees = 0
    let companiesInCache = 0

    for (const company of unenrichedCompanies.slice(0, 20)) {
      // Check first 20 to avoid too many queries
      if (company.domain) {
        const cacheStats = await getCacheStats(company.domain)
        if (cacheStats.exists) {
          companiesInCache++
          totalCachedEmployees += cacheStats.employeesCount
        }
      }
    }

    // Get org credit info
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    // Get saved enrichment filters
    const savedFilters = (icp.filters as Record<string, unknown>)?.enrichmentFilters as
      | {
          decisionMakerTitles?: string[]
          decisionMakerSeniorities?: string[]
          lastUsedAt?: string
        }
      | undefined

    return NextResponse.json({
      icpName: icp.name,
      totalCompanies: icpCompanies.length,
      companiesWithDomains: companiesWithDomains.length,
      companiesWithoutDomains: companiesWithoutDomains.length,
      enrichedCompanies: enrichedCompanies.length,
      unenrichedCompanies: unenrichedCompanies.length,
      cachePreview: {
        companiesChecked: Math.min(20, unenrichedCompanies.length),
        companiesInCache,
        estimatedEmployeesInCache: totalCachedEmployees,
      },
      creditsRemaining: (org?.creditsLimit || 30) - (org?.creditsUsed || 0),
      savedFilters: savedFilters || null,
    })
  } catch (error) {
    console.error('[Quick Enrich] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to get enrichment preview' },
      { status: 500 }
    )
  }
}
