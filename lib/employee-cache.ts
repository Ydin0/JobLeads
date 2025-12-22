// Global Employee Cache Service
// Manages the platform-wide employee data cache for cost-effective enrichment

import { db } from '@/lib/db'
import { globalEmployees, globalCompanies, type GlobalEmployee, type NewGlobalEmployee } from '@/lib/db/schema'
import { eq, ilike, inArray, or, sql, and } from 'drizzle-orm'
import { searchPeopleAtCompany, type EnrichedPerson } from '@/lib/apollo'

// Default staleness threshold in days
const DEFAULT_STALE_DAYS = 30

export interface CacheCheckResult {
  cacheHit: boolean
  employees: GlobalEmployee[]
  employeesCount: number
  lastFetchedAt: Date | null
  isStale: boolean
  globalCompanyId: string | null
}

export interface EnrichmentFilters {
  titles?: string[]
  seniorities?: string[]
}

/**
 * Check if employees for a company domain are cached
 */
export async function checkEmployeeCache(domain: string): Promise<CacheCheckResult> {
  console.log('[EmployeeCache] Checking cache for domain:', domain)

  // Check global_companies for this domain
  const globalCompany = await db.query.globalCompanies.findFirst({
    where: eq(globalCompanies.domain, domain.toLowerCase()),
  })

  if (!globalCompany || !globalCompany.employeesLastFetchedAt) {
    console.log('[EmployeeCache] Cache miss - no record found for domain:', domain)
    return {
      cacheHit: false,
      employees: [],
      employeesCount: 0,
      lastFetchedAt: null,
      isStale: false,
      globalCompanyId: globalCompany?.id || null,
    }
  }

  // Check if cache is stale
  const staleDays = globalCompany.staleAfterDays || DEFAULT_STALE_DAYS
  const isStale = isEmployeeCacheStale(globalCompany.employeesLastFetchedAt, staleDays)

  // Fetch employees from cache
  const employees = await db.query.globalEmployees.findMany({
    where: eq(globalEmployees.companyDomain, domain.toLowerCase()),
  })

  console.log(`[EmployeeCache] Cache hit for ${domain}: ${employees.length} employees, stale: ${isStale}`)

  return {
    cacheHit: true,
    employees,
    employeesCount: employees.length,
    lastFetchedAt: globalCompany.employeesLastFetchedAt,
    isStale,
    globalCompanyId: globalCompany.id,
  }
}

/**
 * Check if the cache is stale based on fetch date
 */
export function isEmployeeCacheStale(lastFetchedAt: Date, staleDays: number = DEFAULT_STALE_DAYS): boolean {
  const now = new Date()
  const staleDate = new Date(lastFetchedAt)
  staleDate.setDate(staleDate.getDate() + staleDays)
  return now > staleDate
}

/**
 * Fetch employees from Apollo and store in global cache
 * @param filters - Seniority/title filters to pass to Apollo (fetches only matching employees)
 * @param fetchAll - If true, fetches ALL employees (no page limit). Use for comprehensive caching.
 */
export async function fetchAndCacheEmployees(
  domain: string,
  companyName: string,
  companyLinkedinUrl?: string,
  filters?: EnrichmentFilters,
  fetchAll: boolean = false
): Promise<GlobalEmployee[]> {
  const hasFilters = filters && (filters.titles?.length || filters.seniorities?.length)
  console.log(`[EmployeeCache] Fetching employees from Apollo for: ${domain} (fetchAll: ${fetchAll}, hasFilters: ${hasFilters})`)

  if (hasFilters) {
    console.log(`[EmployeeCache] Passing filters to Apollo:`, filters)
  }

  try {
    // Map seniority filter values to Apollo's expected format
    let apolloSeniorities: string[] | undefined
    if (filters?.seniorities?.length) {
      const seniorityMap: Record<string, string[]> = {
        c_suite: ['c_suite', 'founder', 'owner'],
        vp: ['vp'],
        director: ['director'],
        manager: ['manager'],
        senior: ['senior'],
        entry: ['entry', 'intern'],
      }
      apolloSeniorities = filters.seniorities.flatMap(
        (s) => seniorityMap[s.toLowerCase()] || [s.toLowerCase()]
      )
    }

    // Fetch from Apollo WITH filters (Apollo will return only matching employees)
    const apolloPeople = await searchPeopleAtCompany({
      organizationDomain: domain,
      titles: filters?.titles,
      seniorities: apolloSeniorities,
      maxPages: fetchAll ? undefined : 10, // When fetchAll, don't limit pages
      fetchAll, // Pass through to Apollo layer
    })

    console.log(`[EmployeeCache] Apollo returned ${apolloPeople.length} employees`)

    if (apolloPeople.length === 0) {
      // Still update the global company record to prevent repeated lookups
      await upsertGlobalCompany(domain, companyName, 0, companyLinkedinUrl)
      return []
    }

    // Convert to global employee records
    const globalEmployeeRecords: NewGlobalEmployee[] = apolloPeople
      .filter((person): person is EnrichedPerson & { apolloId: string } => !!person.apolloId)
      .map((person) => ({
        apolloId: person.apolloId,
        companyDomain: domain.toLowerCase(),
        companyName: companyName,
        companyLinkedinUrl: companyLinkedinUrl || person.company?.linkedinUrl || null,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phone: person.phone,
        jobTitle: person.jobTitle,
        linkedinUrl: person.linkedinUrl,
        location: person.location,
        seniority: person.seniority,
        department: person.departments?.[0] || null,
        metadata: {
          departments: person.departments,
        },
        fetchedAt: new Date(),
      }))

    // Upsert employees into global cache (update if apolloId exists)
    if (globalEmployeeRecords.length > 0) {
      await db
        .insert(globalEmployees)
        .values(globalEmployeeRecords)
        .onConflictDoUpdate({
          target: globalEmployees.apolloId,
          set: {
            email: sql`EXCLUDED.email`,
            phone: sql`EXCLUDED.phone`,
            jobTitle: sql`EXCLUDED.job_title`,
            location: sql`EXCLUDED.location`,
            seniority: sql`EXCLUDED.seniority`,
            department: sql`EXCLUDED.department`,
            metadata: sql`EXCLUDED.metadata`,
            fetchedAt: sql`EXCLUDED.fetched_at`,
            updatedAt: new Date(),
          },
        })
    }

    // Get the Apollo IDs we just fetched to query only those employees
    const fetchedApolloIds = globalEmployeeRecords.map(e => e.apolloId)

    // Update or create global company record
    // Don't update employee count for filtered fetches - just update timestamp
    if (!hasFilters) {
      await upsertGlobalCompany(domain, companyName, globalEmployeeRecords.length, companyLinkedinUrl)
    } else {
      // For filtered fetches, just update the timestamp but not the count
      await upsertGlobalCompanyTimestamp(domain, companyName, companyLinkedinUrl)
    }

    // Return only the employees we just fetched (filtered results), not ALL cached employees
    const storedEmployees = fetchedApolloIds.length > 0
      ? await db.query.globalEmployees.findMany({
          where: inArray(globalEmployees.apolloId, fetchedApolloIds),
        })
      : []

    console.log(`[EmployeeCache] Fetched and cached ${storedEmployees.length} employees for ${domain} (filtered: ${hasFilters})`)
    return storedEmployees
  } catch (error) {
    console.error('[EmployeeCache] Error fetching employees:', error)
    throw error
  }
}

/**
 * Upsert global company record
 */
async function upsertGlobalCompany(
  domain: string,
  name: string,
  employeesCount: number,
  linkedinUrl?: string
): Promise<void> {
  await db
    .insert(globalCompanies)
    .values({
      domain: domain.toLowerCase(),
      name,
      employeesCount,
      employeesLastFetchedAt: new Date(),
      linkedinUrl,
      enrichmentSource: 'apollo',
    })
    .onConflictDoUpdate({
      target: globalCompanies.domain,
      set: {
        name,
        employeesCount,
        employeesLastFetchedAt: new Date(),
        linkedinUrl: linkedinUrl || sql`COALESCE(${globalCompanies.linkedinUrl}, EXCLUDED.linkedin_url)`,
        enrichmentSource: 'apollo',
        updatedAt: new Date(),
      },
    })
}

/**
 * Update global company timestamp without changing employee count
 * Used for filtered fetches where we don't want to overwrite the total count
 */
async function upsertGlobalCompanyTimestamp(
  domain: string,
  name: string,
  linkedinUrl?: string
): Promise<void> {
  // Check if company already exists
  const existing = await db.query.globalCompanies.findFirst({
    where: eq(globalCompanies.domain, domain.toLowerCase()),
  })

  if (existing) {
    // Update only timestamp, preserve existing employeesCount
    await db
      .update(globalCompanies)
      .set({
        name,
        linkedinUrl: linkedinUrl || existing.linkedinUrl,
        enrichmentSource: 'apollo',
        updatedAt: new Date(),
      })
      .where(eq(globalCompanies.domain, domain.toLowerCase()))
  } else {
    // Insert new record - we don't know the count yet, so leave it null/0
    // The count will be set properly when a non-filtered fetch happens
    await db
      .insert(globalCompanies)
      .values({
        domain: domain.toLowerCase(),
        name,
        employeesCount: 0,
        employeesLastFetchedAt: new Date(),
        linkedinUrl,
        enrichmentSource: 'apollo',
      })
  }
}

/**
 * Get employees from cache with optional filters
 */
export async function getEmployeesFromCache(
  domain: string,
  filters?: EnrichmentFilters
): Promise<GlobalEmployee[]> {
  console.log('[EmployeeCache] Getting employees from cache with filters:', { domain, filters })

  // Build all conditions
  const conditions = [eq(globalEmployees.companyDomain, domain.toLowerCase())]

  // Apply title filters (case-insensitive partial match)
  if (filters?.titles && filters.titles.length > 0) {
    const titleConditions = filters.titles.map((title) => ilike(globalEmployees.jobTitle, `%${title}%`))
    conditions.push(or(...titleConditions)!)
  }

  // Apply seniority filters
  if (filters?.seniorities && filters.seniorities.length > 0) {
    // Map common seniority names to Apollo's seniority values
    const seniorityMap: Record<string, string[]> = {
      c_suite: ['c_suite', 'founder', 'owner'],
      vp: ['vp', 'vice_president'],
      director: ['director'],
      manager: ['manager'],
      senior: ['senior'],
      entry: ['entry', 'intern'],
    }

    const mappedSeniorities = filters.seniorities.flatMap(
      (s) => seniorityMap[s.toLowerCase()] || [s.toLowerCase()]
    )

    conditions.push(inArray(globalEmployees.seniority, mappedSeniorities))
  }

  const employees = await db
    .select()
    .from(globalEmployees)
    .where(and(...conditions))

  console.log(`[EmployeeCache] Found ${employees.length} employees matching filters`)
  return employees
}

/**
 * Get or fetch employees for a company domain
 * This is the main entry point for the enrichment flow
 *
 * IMPORTANT: Currently always fetches from Apollo first to build up our database.
 * Once we have sufficient data, we can switch to cache-first approach.
 *
 * @param fetchAll - If true, fetches ALL employees (no limit)
 */
export async function getOrFetchEmployees(
  domain: string,
  companyName: string,
  companyLinkedinUrl?: string | null,
  filters?: EnrichmentFilters,
  forceRefresh: boolean = false,
  fetchAll: boolean = false
): Promise<{
  employees: GlobalEmployee[]
  cacheHit: boolean
  totalAvailable: number
}> {
  const hasFilters = filters && (filters.titles?.length || filters.seniorities?.length)

  // ALWAYS fetch from Apollo first to build our database
  // TODO: Once we have sufficient data, switch to cache-first approach
  console.log(`[EmployeeCache] Fetching from Apollo for ${domain} (fetchAll: ${fetchAll}, hasFilters: ${hasFilters})`)

  try {
    // Fetch from Apollo (with filters if provided)
    const employees = await fetchAndCacheEmployees(
      domain,
      companyName,
      companyLinkedinUrl || undefined,
      filters,
      fetchAll
    )

    console.log(`[EmployeeCache] Apollo returned ${employees.length} employees for ${domain}`)

    return {
      employees,
      cacheHit: false,
      totalAvailable: employees.length,
    }
  } catch (error) {
    console.error(`[EmployeeCache] Apollo fetch failed for ${domain}:`, error)

    // Fallback to cache if Apollo fails
    console.log(`[EmployeeCache] Falling back to cache for ${domain}`)
    const cacheResult = await checkEmployeeCache(domain)

    if (cacheResult.cacheHit) {
      let employees = cacheResult.employees

      // Apply filters to cached data if needed
      if (hasFilters) {
        employees = await getEmployeesFromCache(domain, filters)
      }

      return {
        employees,
        cacheHit: true,
        totalAvailable: cacheResult.employeesCount,
      }
    }

    // No cache available, re-throw the error
    throw error
  }
}

/**
 * Mark a company's employee cache as needing refresh
 */
export async function markCacheForRefresh(domain: string): Promise<void> {
  await db
    .update(globalCompanies)
    .set({
      staleAfterDays: 0, // Force staleness
      updatedAt: new Date(),
    })
    .where(eq(globalCompanies.domain, domain.toLowerCase()))
}

/**
 * Get cache statistics for a domain
 */
export async function getCacheStats(domain: string): Promise<{
  exists: boolean
  employeesCount: number
  lastFetchedAt: Date | null
  isStale: boolean
}> {
  const globalCompany = await db.query.globalCompanies.findFirst({
    where: eq(globalCompanies.domain, domain.toLowerCase()),
  })

  if (!globalCompany) {
    return {
      exists: false,
      employeesCount: 0,
      lastFetchedAt: null,
      isStale: false,
    }
  }

  const staleDays = globalCompany.staleAfterDays || DEFAULT_STALE_DAYS
  const isStale = globalCompany.employeesLastFetchedAt
    ? isEmployeeCacheStale(globalCompany.employeesLastFetchedAt, staleDays)
    : true

  return {
    exists: true,
    employeesCount: globalCompany.employeesCount || 0,
    lastFetchedAt: globalCompany.employeesLastFetchedAt,
    isStale,
  }
}
