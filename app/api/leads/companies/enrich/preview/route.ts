import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, employees, leads, organizations } from '@/lib/db/schema'
import { requireOrgAuth } from '@/lib/auth'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { getOrFetchEmployees, type EnrichmentFilters } from '@/lib/employee-cache'

interface CompanyPreviewResult {
  companyId: string
  companyName: string
  domain: string | null
  hasDomain: boolean
  totalEmployeesInCache: number
  matchingEmployees: number
  alreadyInOrg: number
  newEmployeesToAdd: number
  cacheHit: boolean
  error?: string
}

// POST /api/leads/companies/enrich/preview - Calculate enrichment preview with filters
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth()

    const body = await req.json().catch(() => ({}))
    const {
      companyIds,
      filters,
      fetchAll = false,
    }: {
      companyIds?: string[]
      filters?: EnrichmentFilters
      fetchAll?: boolean
    } = body

    // Get companies to preview
    let targetCompanies
    if (companyIds && companyIds.length > 0) {
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

      if (leadCompanyIds.length === 0) {
        return NextResponse.json({
          companies: [],
          totals: {
            totalCompanies: 0,
            companiesWithMatches: 0,
            companiesWithoutMatches: 0,
            totalMatchingEmployees: 0,
            totalNewEmployees: 0,
            totalCreditsRequired: 0,
          },
          creditsRemaining: 0,
        })
      }

      targetCompanies = await db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          inArray(companies.id, leadCompanyIds)
        ),
      })
    }

    const companiesWithDomains = targetCompanies.filter((c) => c.domain)
    const companiesWithoutDomains = targetCompanies.filter((c) => !c.domain)

    console.log(
      `[Enrich Preview] Calculating preview for ${companiesWithDomains.length} companies with domains (fetchAll: ${fetchAll})`
    )

    // Get org credit info
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    })

    const creditsRemaining = (org?.creditsLimit || 30) - (org?.creditsUsed || 0)

    const results: CompanyPreviewResult[] = []
    let totalMatchingEmployees = 0
    let totalNewEmployees = 0
    let companiesWithMatches = 0
    let companiesWithoutMatches = 0

    // Process each company with domain
    for (const company of companiesWithDomains) {
      try {
        console.log(`[Enrich Preview] Processing: ${company.name} (${company.domain})`)

        // Fetch employees from cache or Apollo
        const {
          employees: globalEmployeesResult,
          cacheHit,
          totalAvailable,
        } = await getOrFetchEmployees(
          company.domain!,
          company.name,
          company.linkedinUrl || undefined,
          filters,
          false, // Don't force refresh
          fetchAll
        )

        // Get existing employees for this company in org
        const existingEmployees = await db.query.employees.findMany({
          where: and(
            eq(employees.orgId, orgId),
            eq(employees.companyId, company.id)
          ),
          columns: { apolloId: true },
        })

        const existingApolloIds = new Set(existingEmployees.map((e) => e.apolloId).filter(Boolean))

        // Calculate new employees (not already in org)
        const newEmployees = globalEmployeesResult.filter(
          (emp) => !existingApolloIds.has(emp.apolloId)
        )

        const matchingCount = globalEmployeesResult.length
        const newCount = newEmployees.length

        if (matchingCount > 0) {
          companiesWithMatches++
        } else {
          companiesWithoutMatches++
        }

        totalMatchingEmployees += matchingCount
        totalNewEmployees += newCount

        results.push({
          companyId: company.id,
          companyName: company.name,
          domain: company.domain,
          hasDomain: true,
          totalEmployeesInCache: totalAvailable,
          matchingEmployees: matchingCount,
          alreadyInOrg: existingApolloIds.size,
          newEmployeesToAdd: newCount,
          cacheHit,
        })

        console.log(
          `[Enrich Preview] ${company.name}: ${matchingCount} matching, ${newCount} new (cache hit: ${cacheHit})`
        )

        // Small delay to avoid overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        console.error(`[Enrich Preview] Error processing ${company.name}:`, error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          companyId: company.id,
          companyName: company.name,
          domain: company.domain,
          hasDomain: true,
          totalEmployeesInCache: 0,
          matchingEmployees: 0,
          alreadyInOrg: 0,
          newEmployeesToAdd: 0,
          cacheHit: false,
          error: errorMessage,
        })
        companiesWithoutMatches++
      }
    }

    // Add companies without domains
    for (const company of companiesWithoutDomains) {
      results.push({
        companyId: company.id,
        companyName: company.name,
        domain: null,
        hasDomain: false,
        totalEmployeesInCache: 0,
        matchingEmployees: 0,
        alreadyInOrg: 0,
        newEmployeesToAdd: 0,
        cacheHit: false,
        error: 'No domain available',
      })
    }

    // Sort results: companies with matches first, then by matching count
    results.sort((a, b) => {
      if (a.newEmployeesToAdd > 0 && b.newEmployeesToAdd === 0) return -1
      if (a.newEmployeesToAdd === 0 && b.newEmployeesToAdd > 0) return 1
      return b.newEmployeesToAdd - a.newEmployeesToAdd
    })

    console.log(
      `[Enrich Preview] Complete: ${totalMatchingEmployees} matching, ${totalNewEmployees} new across ${companiesWithMatches} companies`
    )

    return NextResponse.json({
      companies: results,
      totals: {
        totalCompanies: targetCompanies.length,
        companiesWithDomains: companiesWithDomains.length,
        companiesWithoutDomains: companiesWithoutDomains.length,
        companiesWithMatches,
        companiesWithoutMatches,
        totalMatchingEmployees,
        totalNewEmployees,
        totalCreditsRequired: totalNewEmployees,
      },
      creditsRemaining,
      hasEnoughCredits: creditsRemaining >= totalNewEmployees,
      filters,
      fetchAll,
    })
  } catch (error) {
    console.error('[Enrich Preview] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate enrichment preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
