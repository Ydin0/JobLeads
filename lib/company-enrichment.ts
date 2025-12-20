// Company enrichment service - replaces PDL with Apify LinkedIn scraper
import { db } from "@/lib/db";
import { companies, globalCompanies } from "@/lib/db/schema";
import { scrapeCompanyProfiles, LinkedInCompanyResult } from "@/lib/apify";
import { eq, inArray, sql } from "drizzle-orm";

// Constants
const MAX_BATCH_SIZE = 50; // Max URLs per Apify request
const ENRICHMENT_SOURCE = "linkedin";
const MAX_RETRIES = 2; // Number of retry attempts
const RETRY_DELAY_MS = 5000; // Wait 5 seconds between retries

// Helper to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Scrape with retry logic
async function scrapeWithRetry(
  urls: string[],
  attempt: number = 1
): Promise<{ results: LinkedInCompanyResult[]; success: boolean; error?: string }> {
  try {
    console.log(`[Company Enrichment] Scrape attempt ${attempt}/${MAX_RETRIES} for ${urls.length} URLs`);
    const results = await scrapeCompanyProfiles(urls);

    // Check if we got meaningful results (at least some data back)
    if (results.length === 0 && urls.length > 0) {
      throw new Error("Scraper returned 0 results - possible rate limiting or actor failure");
    }

    // Check if results are valid (have actual data, not just errors)
    const validResults = results.filter(r => r.name && r.url);
    if (validResults.length === 0 && urls.length > 0) {
      throw new Error("Scraper returned no valid company data");
    }

    console.log(`[Company Enrichment] Scrape attempt ${attempt} succeeded: ${validResults.length}/${urls.length} valid results`);
    return { results: validResults, success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Company Enrichment] Scrape attempt ${attempt} failed:`, errorMessage);

    // Retry if we haven't exhausted attempts
    if (attempt < MAX_RETRIES) {
      console.log(`[Company Enrichment] Waiting ${RETRY_DELAY_MS}ms before retry...`);
      await sleep(RETRY_DELAY_MS);
      return scrapeWithRetry(urls, attempt + 1);
    }

    // All retries exhausted
    console.error(`[Company Enrichment] All ${MAX_RETRIES} attempts failed for batch`);
    return { results: [], success: false, error: errorMessage };
  }
}

// Normalize LinkedIn URL for consistent matching
function normalizeLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove query parameters
    parsed.search = "";
    // Normalize to www.linkedin.com
    parsed.hostname = "www.linkedin.com";
    // Ensure no trailing slash
    const cleanUrl = parsed.toString().replace(/\/$/, "");
    return cleanUrl.toLowerCase();
  } catch {
    // If URL parsing fails, just clean it up
    return url.split("?")[0].replace(/\/$/, "").toLowerCase();
  }
}

export interface CompanyToEnrich {
  companyId: string;
  name: string;
  linkedinUrl: string;
}

export interface EnrichedCompanyData {
  name: string;
  domain: string | null;
  website: string | null;
  linkedinUrl: string | null;
  logoUrl: string | null;
  industry: string | null;
  employeeCount: number | null;
  size: string | null;
  location: string | null;
  description: string | null;
  metadata: {
    tagline?: string;
    followerCount?: number;
    tags?: string[];
    linkedinUrn?: string;
  };
}

export interface EnrichmentResult {
  companyId: string;
  success: boolean;
  enrichedData?: EnrichedCompanyData;
  error?: string;
  cacheHit: boolean;
}

// Extract domain from website URL
function extractDomain(websiteUrl?: string): string | null {
  if (!websiteUrl) return null;
  try {
    // Add protocol if missing
    const urlWithProtocol = websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`;
    const url = new URL(urlWithProtocol);
    return url.hostname.replace(/^www\./, "");
  } catch {
    // If URL parsing fails, try to extract domain from the string
    const cleaned = websiteUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
    return cleaned || null;
  }
}

// Format employee count to size string
function formatEmployeeSize(count?: number): string | null {
  if (!count) return null;
  if (count < 10) return "1-10 employees";
  if (count < 50) return "11-50 employees";
  if (count < 200) return "51-200 employees";
  if (count < 500) return "201-500 employees";
  if (count < 1000) return "501-1000 employees";
  if (count < 5000) return "1001-5000 employees";
  if (count < 10000) return "5001-10000 employees";
  return "10000+ employees";
}

// Format location from headquarter object
function formatLocation(headquarter?: LinkedInCompanyResult["headquarter"]): string | null {
  if (!headquarter) return null;
  const parts = [headquarter.city, headquarter.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

// Map LinkedIn data to our enriched company data structure
function mapLinkedInDataToCompany(data: LinkedInCompanyResult): EnrichedCompanyData {
  return {
    name: data.name,
    domain: extractDomain(data.websiteUrl),
    website: data.websiteUrl || null,
    linkedinUrl: data.url,
    logoUrl: data.avatar || null,
    industry: data.industry?.[0] || null,
    employeeCount: data.employeeCount || null,
    size: formatEmployeeSize(data.employeeCount),
    location: formatLocation(data.headquarter),
    description: data.description || data.tagline || null,
    metadata: {
      tagline: data.tagline,
      followerCount: data.followerCount,
      tags: data.hashtag,
      linkedinUrn: data.urn,
    },
  };
}

// Extract company slug from LinkedIn URL for flexible matching
function extractCompanySlug(url: string): string | null {
  try {
    const match = url.match(/linkedin\.com\/company\/([^/?]+)/i);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

// Check global cache for multiple companies by LinkedIn URL
async function checkCacheByLinkedInUrls(
  linkedinUrls: string[]
): Promise<Map<string, typeof globalCompanies.$inferSelect>> {
  if (linkedinUrls.length === 0) {
    return new Map();
  }

  // Extract company slugs for flexible matching
  const slugs = linkedinUrls
    .map(extractCompanySlug)
    .filter((s): s is string => s !== null);

  // Build LIKE patterns for each slug
  const likePatterns = slugs.map(slug => `%/company/${slug}%`);

  // Query cached companies - try exact match first, then slug-based match
  let cached = await db.query.globalCompanies.findMany({
    where: inArray(globalCompanies.linkedinUrl, linkedinUrls),
  });

  // If no exact matches, try slug-based matching
  if (cached.length === 0 && likePatterns.length > 0) {
    // Fetch all cached companies with LinkedIn URLs and filter in memory
    const allCached = await db.query.globalCompanies.findMany({
      where: sql`${globalCompanies.linkedinUrl} IS NOT NULL`,
    });

    // Match by slug
    const inputSlugsSet = new Set(slugs);
    cached = allCached.filter(company => {
      if (!company.linkedinUrl) return false;
      const slug = extractCompanySlug(company.linkedinUrl);
      return slug && inputSlugsSet.has(slug);
    });
  }

  // Build map keyed by normalized URL for lookup
  const cacheMap = new Map<string, typeof globalCompanies.$inferSelect>();
  for (const company of cached) {
    if (company.linkedinUrl) {
      // Store by normalized URL for matching
      const normalizedUrl = normalizeLinkedInUrl(company.linkedinUrl);
      cacheMap.set(normalizedUrl, company);
    }
  }

  return cacheMap;
}

// Convert global company cache entry to EnrichedCompanyData
function globalCompanyToEnrichedData(
  cached: typeof globalCompanies.$inferSelect
): EnrichedCompanyData {
  const metadata = (cached.metadata || {}) as Record<string, unknown>;
  return {
    name: cached.name,
    domain: cached.domain,
    website: cached.websiteUrl,
    linkedinUrl: cached.linkedinUrl,
    logoUrl: cached.logoUrl,
    industry: cached.industry,
    employeeCount: metadata.employeeCount as number | null,
    size: cached.size,
    location: cached.location,
    description: cached.description,
    metadata: {
      tagline: metadata.tagline as string | undefined,
      followerCount: metadata.followerCount as number | undefined,
      tags: metadata.tags as string[] | undefined,
      linkedinUrn: metadata.linkedinUrn as string | undefined,
    },
  };
}

// Main batch enrichment function
export async function enrichCompaniesInBatch(
  companiesToEnrich: CompanyToEnrich[]
): Promise<EnrichmentResult[]> {
  if (companiesToEnrich.length === 0) {
    return [];
  }

  console.log(`[Company Enrichment] Starting batch enrichment for ${companiesToEnrich.length} companies`);

  const results: EnrichmentResult[] = [];
  const linkedinUrls = companiesToEnrich.map((c) => c.linkedinUrl);

  // 1. Check cache first
  const cacheMap = await checkCacheByLinkedInUrls(linkedinUrls);
  console.log(`[Company Enrichment] Cache hits: ${cacheMap.size}/${companiesToEnrich.length}`);

  // 2. Separate cached vs uncached companies
  const uncached: CompanyToEnrich[] = [];
  const urlToCompanyId = new Map<string, string>();

  for (const company of companiesToEnrich) {
    urlToCompanyId.set(company.linkedinUrl, company.companyId);

    // Look up cache by normalized URL
    const normalizedUrl = normalizeLinkedInUrl(company.linkedinUrl);
    const cached = cacheMap.get(normalizedUrl);
    if (cached) {
      // Cache hit - use cached data
      results.push({
        companyId: company.companyId,
        success: true,
        enrichedData: globalCompanyToEnrichedData(cached),
        cacheHit: true,
      });
    } else {
      uncached.push(company);
    }
  }

  // 3. Scrape uncached companies in batches
  if (uncached.length > 0) {
    console.log(`[Company Enrichment] Scraping ${uncached.length} uncached companies...`);

    // Process in batches of MAX_BATCH_SIZE
    for (let i = 0; i < uncached.length; i += MAX_BATCH_SIZE) {
      const batch = uncached.slice(i, i + MAX_BATCH_SIZE);
      const batchUrls = batch.map((c) => c.linkedinUrl);

      // Use retry logic for scraping
      const scrapeResult = await scrapeWithRetry(batchUrls);

      if (scrapeResult.success && scrapeResult.results.length > 0) {
        console.log(`[Company Enrichment] Scraped ${scrapeResult.results.length} companies in batch`);

        // Map scraped results by normalized URL for lookup
        const scrapedMap = new Map<string, LinkedInCompanyResult>();
        for (const item of scrapeResult.results) {
          // Store by normalized URL for matching
          const normalizedUrl = normalizeLinkedInUrl(item.url);
          scrapedMap.set(normalizedUrl, item);
        }

        // Process each company in the batch
        for (const company of batch) {
          // Look up by normalized URL
          const normalizedInputUrl = normalizeLinkedInUrl(company.linkedinUrl);
          const data = scrapedMap.get(normalizedInputUrl);

          if (data) {
            const enrichedData = mapLinkedInDataToCompany(data);

            // Save to global cache
            if (enrichedData.domain || enrichedData.linkedinUrl) {
              try {
                await db
                  .insert(globalCompanies)
                  .values({
                    domain: enrichedData.domain || `linkedin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: enrichedData.name,
                    industry: enrichedData.industry,
                    size: enrichedData.size,
                    location: enrichedData.location,
                    linkedinUrl: enrichedData.linkedinUrl,
                    websiteUrl: enrichedData.website,
                    logoUrl: enrichedData.logoUrl,
                    description: enrichedData.description,
                    enrichmentSource: ENRICHMENT_SOURCE,
                    metadata: {
                      ...enrichedData.metadata,
                      employeeCount: enrichedData.employeeCount,
                    },
                  })
                  .onConflictDoUpdate({
                    target: globalCompanies.domain,
                    set: {
                      name: enrichedData.name,
                      industry: enrichedData.industry,
                      size: enrichedData.size,
                      location: enrichedData.location,
                      linkedinUrl: enrichedData.linkedinUrl,
                      websiteUrl: enrichedData.website,
                      logoUrl: enrichedData.logoUrl,
                      description: enrichedData.description,
                      enrichmentSource: ENRICHMENT_SOURCE,
                      metadata: {
                        ...enrichedData.metadata,
                        employeeCount: enrichedData.employeeCount,
                      },
                      updatedAt: new Date(),
                    },
                  });
                console.log(`[Company Enrichment] Saved ${enrichedData.name} to global cache`);
              } catch (err) {
                console.log(`[Company Enrichment] Could not save to global cache:`, err);
              }
            }

            results.push({
              companyId: company.companyId,
              success: true,
              enrichedData,
              cacheHit: false,
            });
          } else {
            // Company wasn't in scraper results - mark as skipped, not failed
            results.push({
              companyId: company.companyId,
              success: false,
              error: "Company not found in scraper results",
              cacheHit: false,
            });
          }
        }
      } else {
        // Scraping failed after all retries - gracefully mark companies as unenriched
        console.warn(`[Company Enrichment] Batch scraping failed after retries. Marking ${batch.length} companies as unenriched.`);

        for (const company of batch) {
          results.push({
            companyId: company.companyId,
            success: false,
            error: scrapeResult.error || "Scraping failed after retries",
            cacheHit: false,
          });
        }
      }
    }
  }

  // 4. Update org companies with enriched data
  const successfulResults = results.filter((r) => r.success && r.enrichedData);
  if (successfulResults.length > 0) {
    console.log(`[Company Enrichment] Updating ${successfulResults.length} org companies...`);

    for (const result of successfulResults) {
      const data = result.enrichedData!;
      try {
        await db
          .update(companies)
          .set({
            domain: data.domain,
            industry: data.industry,
            size: data.size,
            location: data.location,
            websiteUrl: data.website,
            logoUrl: data.logoUrl,
            description: data.description,
            isEnriched: true,
            enrichedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(companies.id, result.companyId));
      } catch (err) {
        console.error(`[Company Enrichment] Failed to update company ${result.companyId}:`, err);
      }
    }
  }

  const failedResults = results.filter((r) => !r.success);
  const cacheHits = results.filter((r) => r.cacheHit).length;

  console.log(`[Company Enrichment] Completed:`);
  console.log(`  - Total companies: ${results.length}`);
  console.log(`  - Successfully enriched: ${successfulResults.length}`);
  console.log(`  - Cache hits: ${cacheHits}`);
  console.log(`  - Failed/skipped: ${failedResults.length}`);

  if (failedResults.length > 0 && successfulResults.length === 0) {
    console.warn(`[Company Enrichment] Warning: All enrichment attempts failed. Companies will remain unenriched but are still usable.`);
  }

  return results;
}
