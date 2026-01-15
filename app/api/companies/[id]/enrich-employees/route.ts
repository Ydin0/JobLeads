import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { companies, employees, creditUsage, enrichmentTransactions, searches, organizationMembers, creditHistory } from '@/lib/db/schema'
import { requireOrgAuth, checkMemberCredits } from '@/lib/auth'
import { eq, and, sql } from 'drizzle-orm'
import { getOrFetchEmployees, type EnrichmentFilters } from '@/lib/employee-cache'

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/companies/[id]/enrich-employees - Enrich employees using global cache
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { orgId, userId } = await requireOrgAuth()
    const { id } = await params

    // Get options from request body
    const body = await req.json().catch(() => ({}))
    const {
      filters,
      saveFiltersToIcp,
      icpId,
      forceRefresh = false,
    }: {
      filters?: EnrichmentFilters
      saveFiltersToIcp?: boolean
      icpId?: string
      forceRefresh?: boolean
    } = body

    // Get the company
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Need a domain to search for employees
    const domain = company.domain
    if (!domain) {
      return NextResponse.json(
        { error: 'Company domain is required for employee enrichment. Please enrich the company first.' },
        { status: 400 }
      )
    }

    console.log('[Enrich Employees] Starting enrichment for:', company.name, '- Domain:', domain)

    // Use cache-first approach
    const { employees: globalEmployeesResult, cacheHit, totalAvailable } = await getOrFetchEmployees(
      domain,
      company.name,
      company.linkedinUrl || undefined,
      filters,
      forceRefresh
    )

    console.log(`[Enrich Employees] Retrieved ${globalEmployeesResult.length} employees (cache hit: ${cacheHit}, total available: ${totalAvailable})`)

    // Calculate credits (1 credit per employee copied to org)
    const creditsToUse = globalEmployeesResult.length

    // Check member-level limits first
    const memberCheck = await checkMemberCredits(userId, orgId, 'enrichment', creditsToUse)
    if (!memberCheck.allowed) {
      return NextResponse.json(
        {
          error: memberCheck.reason,
          creditsRequired: creditsToUse,
          creditsRemaining: memberCheck.remaining,
          limitType: 'member',
        },
        { status: 402 }
      )
    }

    // Get or create org credit usage record
    let credits = await db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    })

    if (!credits) {
      const now = new Date()
      const cycleEnd = new Date(now)
      cycleEnd.setMonth(cycleEnd.getMonth() + 1)

      const [newCredits] = await db
        .insert(creditUsage)
        .values({
          orgId,
          enrichmentLimit: 200,
          icpLimit: 1000,
          enrichmentUsed: 0,
          icpUsed: 0,
          billingCycleStart: now,
          billingCycleEnd: cycleEnd,
          planId: 'free',
        })
        .returning()

      credits = newCredits
    }

    // Check if billing cycle has ended and reset if needed
    const now = new Date()
    if (credits.billingCycleEnd && new Date(credits.billingCycleEnd) < now) {
      const cycleEnd = new Date(now)
      cycleEnd.setMonth(cycleEnd.getMonth() + 1)

      const [updatedCredits] = await db
        .update(creditUsage)
        .set({
          enrichmentUsed: 0,
          icpUsed: 0,
          billingCycleStart: now,
          billingCycleEnd: cycleEnd,
          updatedAt: now,
        })
        .where(eq(creditUsage.orgId, orgId))
        .returning()

      credits = updatedCredits

      // Also reset all member usage for this org
      await db
        .update(organizationMembers)
        .set({
          enrichmentUsed: 0,
          icpUsed: 0,
          updatedAt: now,
        })
        .where(eq(organizationMembers.orgId, orgId))
    }

    // Check org-level credits
    const creditsRemaining = credits.enrichmentLimit - credits.enrichmentUsed
    if (creditsToUse > creditsRemaining) {
      return NextResponse.json(
        {
          error: 'Insufficient enrichment credits',
          creditsRequired: creditsToUse,
          creditsRemaining,
          limitType: 'organization',
        },
        { status: 402 }
      )
    }

    // Copy employees from global cache to org-scoped employees table
    let employeesCreated = 0
    const globalEmployeeIds: string[] = []

    for (const globalEmployee of globalEmployeesResult) {
      try {
        await db
          .insert(employees)
          .values({
            orgId,
            companyId: id,
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
            },
          })
          .onConflictDoNothing()

        employeesCreated++
        globalEmployeeIds.push(globalEmployee.id)
      } catch (err) {
        console.error('[Enrich Employees] Error creating employee:', err)
      }
    }

    // Deduct credits from org and member
    await db
      .update(creditUsage)
      .set({
        enrichmentUsed: sql`${creditUsage.enrichmentUsed} + ${employeesCreated}`,
        updatedAt: new Date(),
      })
      .where(eq(creditUsage.orgId, orgId))

    await db
      .update(organizationMembers)
      .set({
        enrichmentUsed: sql`${organizationMembers.enrichmentUsed} + ${employeesCreated}`,
        updatedAt: new Date(),
      })
      .where(and(eq(organizationMembers.orgId, orgId), eq(organizationMembers.userId, userId)))

    // Log the transaction
    await db.insert(enrichmentTransactions).values({
      orgId,
      userId,
      transactionType: 'company_enrich',
      creditsUsed: employeesCreated,
      companyId: id,
      searchId: icpId || company.searchId,
      employeeCount: employeesCreated,
      cacheHit,
      apolloCallsMade: cacheHit ? 0 : 1,
      metadata: {
        filters,
        sourceCompanyDomain: domain,
        globalEmployeeIds,
      },
    })

    // Log to creditHistory for enrichment credit usage
    const updatedCredits = await db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    })
    await db.insert(creditHistory).values({
      orgId,
      userId,
      creditType: 'enrichment',
      transactionType: 'company_enrich',
      creditsUsed: employeesCreated,
      balanceAfter: updatedCredits ? updatedCredits.enrichmentLimit - updatedCredits.enrichmentUsed : null,
      description: `Enrichment credit usage for company ${company.name}`,
      searchId: icpId || company.searchId || null,
      companyId: id,
      metadata: {
        filters: filters ? { ...filters } : {},
        sourceCompanyDomain: domain,
        globalEmployeeIds,
      } as Record<string, unknown>,
    })

    // Save filters to ICP if requested
    if (saveFiltersToIcp && icpId && filters) {
      const search = await db.query.searches.findFirst({
        where: and(eq(searches.id, icpId), eq(searches.orgId, orgId)),
      })

      if (search) {
        const currentFilters = (search.filters || {}) as Record<string, unknown>
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
    }

    // Mark company as enriched
    await db
      .update(companies)
      .set({
        isEnriched: true,
        enrichedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))

    console.log(`[Enrich Employees] Completed: ${employeesCreated} employees added, ${employeesCreated} credits used`)

    return NextResponse.json({
      success: true,
      employeesFound: globalEmployeesResult.length,
      employeesCreated,
      creditsUsed: employeesCreated,
      cacheHit,
      totalAvailableInCache: totalAvailable,
      filters: filters || null,
    })
  } catch (error) {
    console.error('[Enrich Employees] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to enrich employees',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET /api/companies/[id]/enrich-employees - Get enrichment status and available employees count
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth()
    const { id } = await params

    // Get the company
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (!company.domain) {
      return NextResponse.json({
        hasDomain: false,
        cacheExists: false,
        employeesInCache: 0,
        isStale: false,
        lastFetchedAt: null,
      })
    }

    // Check cache status
    const { getCacheStats } = await import('@/lib/employee-cache')
    const cacheStats = await getCacheStats(company.domain)

    // Get current employees for this company in org
    const orgEmployeesCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(and(eq(employees.companyId, id), eq(employees.orgId, orgId)))

    return NextResponse.json({
      hasDomain: true,
      cacheExists: cacheStats.exists,
      employeesInCache: cacheStats.employeesCount,
      isStale: cacheStats.isStale,
      lastFetchedAt: cacheStats.lastFetchedAt,
      employeesInOrg: orgEmployeesCount[0]?.count || 0,
    })
  } catch (error) {
    console.error('[Enrich Employees] GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to get enrichment status' },
      { status: 500 }
    )
  }
}
