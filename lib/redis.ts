import { Redis } from '@upstash/redis'

// Redis client for caching
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your environment

let redis: Redis | null = null

export function getRedis(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('[Redis] Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN - caching disabled')
    return null
  }

  redis = new Redis({ url, token })
  return redis
}

// Cache key prefixes
export const CACHE_KEYS = {
  PERSON: 'person:', // person:{linkedinUrl} or person:{email}
  COMPANY: 'company:', // company:{domain}
  PHONE: 'phone:', // phone:{apolloId}
} as const

// Cache TTLs in seconds
export const CACHE_TTL = {
  PERSON: 60 * 60 * 24 * 7, // 7 days for person data
  COMPANY: 60 * 60 * 24 * 30, // 30 days for company data
  PHONE: 60 * 60 * 24 * 90, // 90 days for phone numbers (rarely change)
} as const

/**
 * Get a value from Redis cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const value = await client.get<T>(key)
    if (value) {
      console.log(`[Redis] Cache HIT: ${key}`)
    }
    return value
  } catch (error) {
    console.error('[Redis] Get error:', error)
    return null
  }
}

/**
 * Set a value in Redis cache with TTL
 */
export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.set(key, value, { ex: ttlSeconds })
    console.log(`[Redis] Cache SET: ${key} (TTL: ${ttlSeconds}s)`)
  } catch (error) {
    console.error('[Redis] Set error:', error)
  }
}

/**
 * Delete a value from Redis cache
 */
export async function cacheDel(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.del(key)
    console.log(`[Redis] Cache DEL: ${key}`)
  } catch (error) {
    console.error('[Redis] Del error:', error)
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return getRedis() !== null
}
