/**
 * Enrichment Cache Service
 *
 * Multi-layer caching for enrichment data to save API credits:
 * 1. Redis (fast, temporary) - Check first
 * 2. PostgreSQL (persistent) - Check second
 * 3. Apollo API (costs credits) - Only if cache miss
 */

import { db } from '@/lib/db'
import { globalEmployees, globalCompanies } from '@/lib/db/schema'
import { eq, or, sql } from 'drizzle-orm'
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'
import type { EnrichedPerson, EnrichedCompany } from '@/lib/apollo'

// Types for cached data
export interface CachedPerson {
  id: string
  linkedinUrl: string | null
  email: string | null
  firstName: string
  lastName: string
  jobTitle: string | null
  phone: string | null
  companyPhone: string | null
  apolloId: string | null
  companyName: string | null
  companyDomain: string | null
  location: string | null
  cachedAt: string
  source: 'redis' | 'db' | 'apollo'
}

export interface CachedCompany {
  id: string
  name: string
  domain: string
  linkedinUrl: string | null
  industry: string | null
  size: string | null
  location: string | null
  description: string | null
  logoUrl: string | null
  cachedAt: string
  source: 'redis' | 'db' | 'apollo'
}

/**
 * Normalize LinkedIn URL for consistent cache keys
 */
function normalizeLinkedInUrl(url: string): string {
  // Extract the profile path from various LinkedIn URL formats
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/i)
  return match ? match[1].toLowerCase() : url.toLowerCase()
}

/**
 * Generate cache key for a person
 */
function getPersonCacheKey(params: { linkedinUrl?: string; email?: string }): string | null {
  if (params.linkedinUrl) {
    return `${CACHE_KEYS.PERSON}linkedin:${normalizeLinkedInUrl(params.linkedinUrl)}`
  }
  if (params.email) {
    return `${CACHE_KEYS.PERSON}email:${params.email.toLowerCase()}`
  }
  return null
}

/**
 * Generate cache key for a company
 */
function getCompanyCacheKey(domain: string): string {
  return `${CACHE_KEYS.COMPANY}${domain.toLowerCase()}`
}

/**
 * Generate cache key for phone lookup
 */
function getPhoneCacheKey(apolloId: string): string {
  return `${CACHE_KEYS.PHONE}${apolloId}`
}

/**
 * Look up a person from cache (Redis -> DB)
 * Returns null if not found, allowing caller to fetch from Apollo
 */
export async function getCachedPerson(params: {
  linkedinUrl?: string
  email?: string
}): Promise<CachedPerson | null> {
  const cacheKey = getPersonCacheKey(params)

  // Step 1: Check Redis
  if (cacheKey) {
    const redisData = await cacheGet<CachedPerson>(cacheKey)
    if (redisData) {
      console.log(`[EnrichmentCache] 🔴 REDIS HIT - Person: ${redisData.firstName} ${redisData.lastName}`)
      return { ...redisData, source: 'redis' }
    }
    console.log(`[EnrichmentCache] Redis MISS for person lookup`)
  }

  // Step 2: Check PostgreSQL (globalEmployees)
  try {
    const conditions = []
    if (params.linkedinUrl) {
      conditions.push(sql`LOWER(${globalEmployees.linkedinUrl}) = ${params.linkedinUrl.toLowerCase()}`)
    }
    if (params.email) {
      conditions.push(sql`LOWER(${globalEmployees.email}) = ${params.email.toLowerCase()}`)
    }

    if (conditions.length === 0) return null

    const dbPerson = await db.query.globalEmployees.findFirst({
      where: or(...conditions),
    })

    if (dbPerson) {
      const cached: CachedPerson = {
        id: dbPerson.id,
        linkedinUrl: dbPerson.linkedinUrl,
        email: dbPerson.email,
        firstName: dbPerson.firstName,
        lastName: dbPerson.lastName,
        jobTitle: dbPerson.jobTitle,
        phone: dbPerson.phone,
        companyPhone: null, // Not stored in globalEmployees
        apolloId: dbPerson.apolloId || null,
        companyName: dbPerson.companyName,
        companyDomain: dbPerson.companyDomain,
        location: dbPerson.location,
        cachedAt: dbPerson.fetchedAt?.toISOString() || new Date().toISOString(),
        source: 'db',
      }

      // Populate Redis for faster future lookups
      if (cacheKey) {
        await cacheSet(cacheKey, cached, CACHE_TTL.PERSON)
        console.log(`[EnrichmentCache] Populated Redis cache for future lookups`)
      }

      console.log(`[EnrichmentCache] 🐘 POSTGRES HIT - Person: ${dbPerson.firstName} ${dbPerson.lastName}`)
      return cached
    }
  } catch (error) {
    console.error('[EnrichmentCache] DB lookup error:', error)
  }

  return null
}

/**
 * Look up a company from cache (Redis -> DB)
 * Returns null if not found, allowing caller to fetch from Apollo
 */
export async function getCachedCompany(domain: string): Promise<CachedCompany | null> {
  const cacheKey = getCompanyCacheKey(domain)

  // Step 1: Check Redis
  const redisData = await cacheGet<CachedCompany>(cacheKey)
  if (redisData) {
    console.log(`[EnrichmentCache] 🔴 REDIS HIT - Company: ${redisData.name} (${domain})`)
    return { ...redisData, source: 'redis' }
  }
  console.log(`[EnrichmentCache] Redis MISS for company: ${domain}`)

  // Step 2: Check PostgreSQL (globalCompanies)
  try {
    const dbCompany = await db.query.globalCompanies.findFirst({
      where: sql`LOWER(${globalCompanies.domain}) = ${domain.toLowerCase()}`,
    })

    if (dbCompany) {
      const cached: CachedCompany = {
        id: dbCompany.id,
        name: dbCompany.name,
        domain: dbCompany.domain,
        linkedinUrl: dbCompany.linkedinUrl,
        industry: dbCompany.industry,
        size: dbCompany.employeesCount?.toString() || null,
        location: dbCompany.location,
        description: dbCompany.description,
        logoUrl: dbCompany.logoUrl,
        cachedAt: dbCompany.updatedAt?.toISOString() || new Date().toISOString(),
        source: 'db',
      }

      // Populate Redis for faster future lookups
      await cacheSet(cacheKey, cached, CACHE_TTL.COMPANY)
      console.log(`[EnrichmentCache] Populated Redis cache for future lookups`)

      console.log(`[EnrichmentCache] 🐘 POSTGRES HIT - Company: ${dbCompany.name} (${domain})`)
      return cached
    }
  } catch (error) {
    console.error('[EnrichmentCache] DB lookup error:', error)
  }

  return null
}

/**
 * Look up a phone number from cache
 */
export async function getCachedPhone(apolloId: string): Promise<string | null> {
  const cacheKey = getPhoneCacheKey(apolloId)

  // Check Redis for phone
  const cachedPhone = await cacheGet<string>(cacheKey)
  if (cachedPhone) {
    console.log(`[EnrichmentCache] 🔴 REDIS HIT - Phone for Apollo ID: ${apolloId} -> ${cachedPhone}`)
    return cachedPhone
  }
  console.log(`[EnrichmentCache] Redis MISS for phone, Apollo ID: ${apolloId}`)

  // Check DB (globalEmployees) for phone by Apollo ID
  try {
    const dbPerson = await db.query.globalEmployees.findFirst({
      where: eq(globalEmployees.apolloId, apolloId),
      columns: { phone: true, firstName: true, lastName: true },
    })

    if (dbPerson?.phone) {
      // Cache in Redis
      await cacheSet(cacheKey, dbPerson.phone, CACHE_TTL.PHONE)
      console.log(`[EnrichmentCache] 🐘 POSTGRES HIT - Phone for ${dbPerson.firstName} ${dbPerson.lastName}: ${dbPerson.phone}`)
      return dbPerson.phone
    }
    console.log(`[EnrichmentCache] Postgres MISS - No phone found for Apollo ID: ${apolloId}`)
  } catch (error) {
    console.error('[EnrichmentCache] Phone lookup error:', error)
  }

  return null
}

/**
 * Store enriched person data in cache (Redis + DB)
 */
export async function cachePerson(person: EnrichedPerson): Promise<void> {
  const now = new Date().toISOString()

  // Build cache keys
  const linkedinKey = person.linkedinUrl
    ? `${CACHE_KEYS.PERSON}linkedin:${normalizeLinkedInUrl(person.linkedinUrl)}`
    : null
  const emailKey = person.email
    ? `${CACHE_KEYS.PERSON}email:${person.email.toLowerCase()}`
    : null

  const cached: CachedPerson = {
    id: person.apolloId || `temp-${Date.now()}`,
    linkedinUrl: person.linkedinUrl,
    email: person.email,
    firstName: person.firstName,
    lastName: person.lastName,
    jobTitle: person.jobTitle,
    phone: person.phone,
    companyPhone: person.companyPhone,
    apolloId: person.apolloId,
    companyName: person.company?.name || null,
    companyDomain: person.company?.website?.replace(/^https?:\/\//, '').split('/')[0] || null,
    location: person.location,
    cachedAt: now,
    source: 'apollo',
  }

  // Store in Redis (both keys if available)
  if (linkedinKey) {
    await cacheSet(linkedinKey, cached, CACHE_TTL.PERSON)
  }
  if (emailKey) {
    await cacheSet(emailKey, cached, CACHE_TTL.PERSON)
  }

  // Store phone separately if available
  if (person.apolloId && person.phone) {
    await cacheSet(getPhoneCacheKey(person.apolloId), person.phone, CACHE_TTL.PHONE)
  }

  // Store in PostgreSQL (globalEmployees)
  // Requires: apolloId, companyDomain, firstName, lastName
  const companyDomain = cached.companyDomain || 'unknown'
  if (!person.apolloId) {
    console.log('[EnrichmentCache] Skipping DB storage - no Apollo ID')
    return
  }

  try {
    await db
      .insert(globalEmployees)
      .values({
        apolloId: person.apolloId,
        linkedinUrl: person.linkedinUrl,
        email: person.email,
        firstName: person.firstName,
        lastName: person.lastName,
        jobTitle: person.jobTitle,
        phone: person.phone,
        companyName: cached.companyName,
        companyDomain: companyDomain,
        location: cached.location,
        seniority: person.seniority,
        department: person.departments?.[0] || null,
        metadata: {
          departments: person.departments,
        },
      })
      .onConflictDoUpdate({
        target: globalEmployees.apolloId,
        set: {
          email: person.email,
          firstName: person.firstName,
          lastName: person.lastName,
          jobTitle: person.jobTitle,
          phone: person.phone,
          companyName: cached.companyName,
          companyDomain: companyDomain,
          location: cached.location,
          seniority: person.seniority,
          department: person.departments?.[0] || null,
          metadata: {
            departments: person.departments,
          },
          fetchedAt: new Date(),
        },
      })

    console.log(`[EnrichmentCache] Person stored in DB: ${person.firstName} ${person.lastName}`)
  } catch (error) {
    console.error('[EnrichmentCache] Failed to store person in DB:', error)
  }
}

/**
 * Store enriched company data in cache (Redis + DB)
 */
export async function cacheCompany(company: EnrichedCompany): Promise<void> {
  if (!company.domain) {
    console.log('[EnrichmentCache] Skipping company cache - no domain')
    return
  }

  const now = new Date().toISOString()
  const cacheKey = getCompanyCacheKey(company.domain)

  const cached: CachedCompany = {
    id: `company-${Date.now()}`,
    name: company.name,
    domain: company.domain,
    linkedinUrl: company.linkedinUrl,
    industry: company.industry,
    size: company.employeeCount?.toString() || null,
    location: company.location,
    description: company.description,
    logoUrl: company.logoUrl,
    cachedAt: now,
    source: 'apollo',
  }

  // Store in Redis
  await cacheSet(cacheKey, cached, CACHE_TTL.COMPANY)

  // Store in PostgreSQL (globalCompanies)
  try {
    await db
      .insert(globalCompanies)
      .values({
        domain: company.domain,
        name: company.name,
        linkedinUrl: company.linkedinUrl,
        industry: company.industry,
        employeesCount: company.employeeCount || 0,
        location: cached.location,
        description: company.description,
        logoUrl: company.logoUrl,
        enrichmentSource: 'apollo',
        metadata: {
          foundedYear: company.foundedYear,
          technologies: company.technologies,
          keywords: company.keywords,
          enrichedAt: now,
        },
      })
      .onConflictDoUpdate({
        target: globalCompanies.domain,
        set: {
          name: company.name,
          linkedinUrl: company.linkedinUrl,
          industry: company.industry,
          employeesCount: company.employeeCount || 0,
          location: cached.location,
          description: company.description,
          logoUrl: company.logoUrl,
          enrichmentSource: 'apollo',
          metadata: sql`${globalCompanies.metadata} || ${JSON.stringify({
            foundedYear: company.foundedYear,
            technologies: company.technologies,
            keywords: company.keywords,
            enrichedAt: now,
          })}::jsonb`,
          updatedAt: new Date(),
        },
      })

    console.log(`[EnrichmentCache] Company stored in DB: ${company.name}`)
  } catch (error) {
    console.error('[EnrichmentCache] Failed to store company in DB:', error)
  }
}

/**
 * Store phone number in cache (Redis + DB)
 * Flow: Store in Redis for fast lookups, also update DB for persistence
 */
export async function cachePhone(apolloId: string, phone: string): Promise<void> {
  // Step 1: Store in Redis for fast future lookups
  await cacheSet(getPhoneCacheKey(apolloId), phone, CACHE_TTL.PHONE)
  console.log(`[EnrichmentCache] 🔴 Phone stored in Redis for Apollo ID: ${apolloId}`)

  // Step 2: Update globalEmployees in DB if record exists (for persistence)
  try {
    const result = await db
      .update(globalEmployees)
      .set({
        phone,
        updatedAt: new Date(),
      })
      .where(eq(globalEmployees.apolloId, apolloId))
      .returning()

    if (result.length > 0) {
      console.log(`[EnrichmentCache] 🐘 Phone updated in DB for Apollo ID: ${apolloId}`)
    } else {
      console.log(`[EnrichmentCache] No existing DB record to update for Apollo ID: ${apolloId}`)
    }
  } catch (error) {
    console.error('[EnrichmentCache] Failed to update phone in DB:', error)
  }
}

/**
 * Check if we have cached data for a person (quick check without full data)
 */
export async function hasCachedPerson(params: {
  linkedinUrl?: string
  email?: string
}): Promise<boolean> {
  const cached = await getCachedPerson(params)
  return cached !== null
}

/**
 * Check if we have cached data for a company (quick check without full data)
 */
export async function hasCachedCompany(domain: string): Promise<boolean> {
  const cached = await getCachedCompany(domain)
  return cached !== null
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export async function getCacheStats(): Promise<{
  globalEmployeesCount: number
  globalCompaniesCount: number
}> {
  const [employeesResult, companiesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(globalEmployees),
    db.select({ count: sql<number>`count(*)` }).from(globalCompanies),
  ])

  return {
    globalEmployeesCount: employeesResult[0]?.count || 0,
    globalCompaniesCount: companiesResult[0]?.count || 0,
  }
}
