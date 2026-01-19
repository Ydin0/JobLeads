import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches, companies, jobs, leads, scraperRuns, creditUsage, creditHistory } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, sql, lt, inArray } from "drizzle-orm";
import {
  runLinkedInJobsSearch,
  extractCompaniesFromJobs,
  LinkedInJobsInput,
  LinkedInJobResult,
} from "@/lib/apify";
import { categorizeJob, extractTechStack } from "@/lib/job-analysis";
import { enrichCompaniesInBatch } from "@/lib/company-enrichment";

// Helper to parse full name into first and last name
function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

// Extend timeout for Apify actor runs - max allowed on Vercel hobby plan
export const maxDuration = 300; // 5 minutes (Vercel hobby plan limit)

// Timeout for individual scraper (4 minutes each - since they run in parallel, this is fine)
const SCRAPER_TIMEOUT_MS = 4 * 60 * 1000;

// Stale run threshold - runs older than this in "running" state are considered stuck
const STALE_RUN_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

// Helper to run a promise with timeout
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string
): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(timeoutError)), timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// Clean up stale scraper runs that got stuck in "running" or "queued" state
async function cleanupStaleRuns(searchId: string, orgId: string): Promise<number> {
  const staleThreshold = new Date(Date.now() - STALE_RUN_THRESHOLD_MS);

  // Find runs that are stuck in running/queued state for too long
  const staleRuns = await db
    .select({ id: scraperRuns.id, status: scraperRuns.status, startedAt: scraperRuns.startedAt })
    .from(scraperRuns)
    .where(
      and(
        eq(scraperRuns.searchId, searchId),
        eq(scraperRuns.orgId, orgId),
        inArray(scraperRuns.status, ["running", "queued"]),
        lt(scraperRuns.startedAt, staleThreshold)
      )
    );

  if (staleRuns.length === 0) {
    return 0;
  }

  console.log(`[Search Run] Found ${staleRuns.length} stale scraper runs, marking as failed`);

  // Mark them as failed
  const staleRunIds = staleRuns.map(r => r.id);
  await db
    .update(scraperRuns)
    .set({
      status: "failed",
      errorMessage: "Scraper timed out - request was terminated before completion",
      completedAt: new Date(),
    })
    .where(inArray(scraperRuns.id, staleRunIds));

  return staleRuns.length;
}

type RouteContext = { params: Promise<{ id: string }> };

interface ScraperConfig {
  jobTitle: string;
  location: string;
  experienceLevel: string;
}

interface SearchFilters {
  jobTitles?: string[];
  locations?: string[];
  companyNames?: string[];
  companyIds?: string[];
  keywords?: string[];
  departments?: string[];
  techStack?: string[];
  minJobs?: number;
  scrapers?: ScraperConfig[];
  jobBoards?: string[];
  maxRows?: number;
  publishedAt?: string;
}

// Process job results and store companies, jobs, leads
async function processJobResults(
  jobResults: LinkedInJobResult[],
  orgId: string,
  searchId: string,
  existingCompanyMap: Map<string, string>
): Promise<{
  companiesStored: number;
  newCompanies: number;
  jobsStored: number;
  leadsCreated: number;
  companyIdMap: Map<string, string>;
}> {
  // Extract unique companies from results
  const extractedCompanies = extractCompaniesFromJobs(jobResults);

  // Store companies in database and track their IDs
  const companyIdMap = new Map<string, string>(existingCompanyMap);
  let newCompanies = 0;
  const companiesToEnrich: Array<{ id: string; name: string; linkedinUrl: string | null }> = [];

  for (const company of extractedCompanies) {
    const companyKey = company.name.toLowerCase();

    // Skip if we already have this company in our map
    if (companyIdMap.has(companyKey)) continue;

    // Check if company already exists in DB (may have been inserted by a parallel scraper)
    // This is important because there's no unique constraint on (orgId, searchId, name)
    const existing = await db.query.companies.findFirst({
      where: and(
        eq(companies.orgId, orgId),
        eq(companies.searchId, searchId),
        sql`LOWER(${companies.name}) = ${companyKey}`
      ),
      columns: { id: true },
    });

    if (existing) {
      // Company already exists, use its ID
      companyIdMap.set(companyKey, existing.id);
      continue;
    }

    // Insert new company
    const [inserted] = await db
      .insert(companies)
      .values({
        orgId,
        searchId,
        name: company.name,
        linkedinUrl: company.linkedinUrl,
        logoUrl: company.logoUrl,
        metadata: {
          linkedinId: company.linkedinId,
          jobCount: company.jobCount,
        },
      })
      .returning();

    if (inserted) {
      newCompanies++;
      companyIdMap.set(companyKey, inserted.id);
      // Queue for auto-enrichment
      companiesToEnrich.push({
        id: inserted.id,
        name: company.name,
        linkedinUrl: company.linkedinUrl,
      });
    }
  }

  // Batch enrich new companies using LinkedIn scraper
  // IMPORTANT: Must await enrichment - serverless functions terminate after response is sent
  if (companiesToEnrich.length > 0) {
    // Filter to only companies with LinkedIn URLs
    const withLinkedIn = companiesToEnrich.filter(c => c.linkedinUrl);

    if (withLinkedIn.length > 0) {
      console.log(`[Search Run] Batch enriching ${withLinkedIn.length} companies with LinkedIn URLs...`);

      try {
        // Await enrichment to ensure it completes before function terminates
        const enrichmentResults = await enrichCompaniesInBatch(
          withLinkedIn.map(c => ({
            companyId: c.id,
            name: c.name,
            linkedinUrl: c.linkedinUrl!,
          }))
        );
        const successful = enrichmentResults.filter(r => r.success).length;
        console.log(`[Search Run] Batch enriched ${successful}/${enrichmentResults.length} companies`);
      } catch (err) {
        console.error("[Search Run] Batch enrichment failed:", err);
        // Don't fail the whole scraper run if enrichment fails
      }
    } else {
      console.log(`[Search Run] No companies with LinkedIn URLs to enrich`);
    }
  }

  // Store jobs in database
  let jobsStored = 0;
  for (const job of jobResults) {
    if (!job.companyName) continue;

    const companyId = companyIdMap.get(job.companyName.toLowerCase());
    if (!companyId) continue;

    try {
      const department = categorizeJob(job.title);
      const techStack = extractTechStack(job.description);

      await db.insert(jobs).values({
        orgId,
        companyId,
        searchId,
        externalId: job.id?.toString(),
        title: job.title,
        jobUrl: job.jobUrl,
        location: job.location,
        salary: job.salary,
        contractType: job.contractType,
        experienceLevel: job.experienceLevel,
        workType: job.workType,
        sector: job.sector,
        department,
        techStack,
        description: job.description,
        postedTime: job.postedTime,
        publishedAt: job.publishedAt ? new Date(job.publishedAt) : null,
        applicationsCount: job.applicationsCount,
        applyUrl: job.applyUrl,
        applyType: job.applyType,
        posterName: job.posterFullName,
        posterUrl: job.posterProfileUrl,
      }).onConflictDoNothing();
      jobsStored++;
    } catch (err) {
      console.error("[Search Run] Error storing job:", err);
    }
  }

  // Create leads from job posters
  let leadsCreated = 0;
  const seenPosterUrls = new Set<string>();

  for (const job of jobResults) {
    if (!job.posterFullName || !job.posterProfileUrl) continue;
    if (seenPosterUrls.has(job.posterProfileUrl)) continue;
    seenPosterUrls.add(job.posterProfileUrl);

    if (!job.companyName) continue;
    const companyId = companyIdMap.get(job.companyName.toLowerCase());
    if (!companyId) continue;

    try {
      const { firstName, lastName } = parseFullName(job.posterFullName);

      await db.insert(leads).values({
        orgId,
        companyId,
        searchId,
        firstName,
        lastName,
        linkedinUrl: job.posterProfileUrl,
        jobTitle: "Job Poster",
        status: "new",
        metadata: {
          source: "linkedin_job_poster",
          jobTitle: job.title,
          jobUrl: job.jobUrl,
        },
      }).onConflictDoNothing();
      leadsCreated++;
    } catch (err) {
      console.error("[Search Run] Error creating lead:", err);
    }
  }

  return {
    companiesStored: companyIdMap.size,
    newCompanies,
    jobsStored,
    leadsCreated,
    companyIdMap,
  };
}

// Run a single scraper (can accept pre-created run ID or create new one)
async function runSingleScraper(
  scraper: ScraperConfig,
  scraperIndex: number,
  orgId: string,
  searchId: string,
  maxRows: number,
  existingCompanyMap: Map<string, string>,
  existingRunId?: string
): Promise<{
  scraperRunId: string;
  jobsFound: number;
  companiesFound: number;
  newCompanies: number;
  leadsCreated: number;
  companyIdMap: Map<string, string>;
  error?: string;
  cancelled?: boolean;
}> {
  const startTime = Date.now();

  let scraperRunId: string;

  if (existingRunId) {
    // Check if the queued run was cancelled
    const existingRun = await db.query.scraperRuns.findFirst({
      where: eq(scraperRuns.id, existingRunId),
    });

    if (!existingRun) {
      return {
        scraperRunId: existingRunId,
        jobsFound: 0,
        companiesFound: 0,
        newCompanies: 0,
        leadsCreated: 0,
        companyIdMap: existingCompanyMap,
        error: "Scraper run not found",
      };
    }

    if (existingRun.status === "cancelled") {
      console.log(`[Search Run] Scraper ${scraperIndex} was cancelled, skipping`);
      return {
        scraperRunId: existingRunId,
        jobsFound: 0,
        companiesFound: 0,
        newCompanies: 0,
        leadsCreated: 0,
        companyIdMap: existingCompanyMap,
        cancelled: true,
      };
    }

    // Update status to running
    await db
      .update(scraperRuns)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(scraperRuns.id, existingRunId));

    scraperRunId = existingRunId;
  } else {
    // Create new scraper run record
    const [scraperRun] = await db
      .insert(scraperRuns)
      .values({
        searchId,
        orgId,
        scraperIndex,
        scraperConfig: scraper,
        status: "running",
      })
      .returning();

    scraperRunId = scraperRun.id;
  }

  try {
    console.log(`[Search Run] Running scraper ${scraperIndex}: "${scraper.jobTitle}" in "${scraper.location}"`);

    // Build Apify input for this specific scraper
    const apifyInput: LinkedInJobsInput = {
      title: scraper.jobTitle,
      location: scraper.location,
      rows: maxRows,
    };

    // Run the LinkedIn Jobs search with timeout protection
    const jobResults = await withTimeout(
      runLinkedInJobsSearch(apifyInput),
      SCRAPER_TIMEOUT_MS,
      `Scraper ${scraperIndex} timed out after ${SCRAPER_TIMEOUT_MS / 1000}s`
    );
    console.log(`[Search Run] Scraper ${scraperIndex} returned ${jobResults.length} jobs`);

    // Process results
    const results = await processJobResults(jobResults, orgId, searchId, existingCompanyMap);

    // Calculate duration
    const duration = Math.round((Date.now() - startTime) / 1000);

    // Update scraper run with results
    await db
      .update(scraperRuns)
      .set({
        status: "completed",
        jobsFound: jobResults.length,
        companiesFound: results.companiesStored,
        newCompanies: results.newCompanies,
        leadsCreated: results.leadsCreated,
        duration,
        completedAt: new Date(),
      })
      .where(eq(scraperRuns.id, scraperRunId));

    return {
      scraperRunId,
      jobsFound: jobResults.length,
      companiesFound: results.companiesStored,
      newCompanies: results.newCompanies,
      leadsCreated: results.leadsCreated,
      companyIdMap: results.companyIdMap,
    };
  } catch (error) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    // Update scraper run with error
    await db
      .update(scraperRuns)
      .set({
        status: "failed",
        duration,
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(scraperRuns.id, scraperRunId));

    console.error(`[Search Run] Scraper ${scraperIndex} failed:`, error);

    return {
      scraperRunId,
      jobsFound: 0,
      companiesFound: 0,
      newCompanies: 0,
      leadsCreated: 0,
      companyIdMap: existingCompanyMap,
      error: errorMessage,
    };
  }
}

// POST /api/searches/[id]/run - Execute scrapers and store results
export async function POST(req: Request, { params }: RouteContext) {
  try {
    console.log("[Search Run] Starting search execution...");
    const { orgId, userId } = await requireOrgAuth();
    const { id } = await params;
    console.log("[Search Run] Org ID:", orgId, "Search ID:", id);

    // Get optional scraper index from body
    const body = await req.json().catch(() => ({}));
    const { scraperIndex: targetScraperIndex } = body as { scraperIndex?: number };

    // Get the search
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, id), eq(searches.orgId, orgId)),
    });

    if (!search) {
      console.log("[Search Run] Search not found");
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }
    console.log("[Search Run] Found search:", search.name);

    const filters = search.filters as SearchFilters | null;
    const scrapers = filters?.scrapers || [];
    const maxRows = filters?.maxRows || 100;

    // Check credit availability before running
    const credits = await db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    });

    if (credits && credits.icpUsed >= credits.icpLimit) {
      console.log("[Search Run] Insufficient ICP credits");
      return NextResponse.json(
        { error: "Insufficient ICP credits. Please upgrade your plan to continue." },
        { status: 402 }
      );
    }

    // If no scrapers configured, fall back to legacy behavior
    if (scrapers.length === 0) {
      console.log("[Search Run] No scrapers configured, using legacy job titles");

      // Create a single scraper from legacy config
      const legacyScraper: ScraperConfig = {
        jobTitle: filters?.jobTitles?.join(" OR ") || filters?.keywords?.join(" OR ") || "",
        location: filters?.locations?.[0] || "",
        experienceLevel: "any",
      };

      if (!legacyScraper.jobTitle) {
        return NextResponse.json(
          { error: "No scrapers or job titles configured" },
          { status: 400 }
        );
      }

      scrapers.push(legacyScraper);
    }

    // Determine which scrapers to run
    const scrapersToRun = targetScraperIndex !== undefined
      ? [{ scraper: scrapers[targetScraperIndex], index: targetScraperIndex }]
      : scrapers.map((scraper, index) => ({ scraper, index }));

    if (targetScraperIndex !== undefined && !scrapers[targetScraperIndex]) {
      return NextResponse.json(
        { error: `Scraper at index ${targetScraperIndex} not found` },
        { status: 400 }
      );
    }

    console.log(`[Search Run] Running ${scrapersToRun.length} scraper(s)`);

    // Clean up any stale runs from previous failed attempts
    const staleRunsCleanedUp = await cleanupStaleRuns(id, orgId);
    if (staleRunsCleanedUp > 0) {
      console.log(`[Search Run] Cleaned up ${staleRunsCleanedUp} stale scraper runs`);
    }

    // Initialize result tracking
    let totalJobsFound = 0;
    let totalCompaniesFound = 0;
    let totalNewCompanies = 0;
    let totalLeadsCreated = 0;
    let totalCancelled = 0;
    let totalFailed = 0;
    const companyIdMap = new Map<string, string>();
    const scraperResults: Array<{
      scraperIndex: number;
      scraperConfig: ScraperConfig;
      scraperRunId: string;
      jobsFound: number;
      newCompanies: number;
      leadsCreated: number;
      error?: string;
      cancelled?: boolean;
    }> = [];

    // Create all scraper runs as "queued" first so users can see them
    const queuedRunIds: Map<number, string> = new Map();

    console.log(`[Search Run] Creating ${scrapersToRun.length} queued scraper runs`);

    for (const { scraper, index } of scrapersToRun) {
      const [queuedRun] = await db
        .insert(scraperRuns)
        .values({
          searchId: id,
          orgId,
          scraperIndex: index,
          scraperConfig: scraper,
          status: "queued",
        })
        .returning();

      queuedRunIds.set(index, queuedRun.id);
    }

    console.log(`[Search Run] Created ${queuedRunIds.size} queued runs, starting parallel execution`);

    // Pre-load existing companies for this search to avoid duplicates in parallel execution
    // This ensures all scrapers use the same company IDs for companies that already exist
    const existingCompanies = await db
      .select({ id: companies.id, name: companies.name })
      .from(companies)
      .where(and(eq(companies.orgId, orgId), eq(companies.searchId, id)));

    const sharedCompanyMap = new Map<string, string>();
    for (const company of existingCompanies) {
      sharedCompanyMap.set(company.name.toLowerCase(), company.id);
    }
    console.log(`[Search Run] Pre-loaded ${sharedCompanyMap.size} existing companies for this search`);

    // Run all scrapers in parallel using Promise.allSettled for fault tolerance
    // Each scraper gets a copy of the shared map to avoid race conditions on writes
    // but shares existing company IDs to prevent duplicates
    const scraperPromises = scrapersToRun.map(async ({ scraper, index }) => {
      const existingRunId = queuedRunIds.get(index);

      // Pass a copy of the shared map so each scraper can add new companies without conflicts
      // New companies added by one scraper won't be visible to others, but that's OK
      // since they'll still create their own records (which is fine for new companies)
      const result = await runSingleScraper(
        scraper,
        index,
        orgId,
        id,
        maxRows,
        new Map(sharedCompanyMap), // Copy of shared map with existing companies
        existingRunId
      );

      return { scraper, index, result };
    });

    // Wait for all scrapers to complete (or fail)
    const settledResults = await Promise.allSettled(scraperPromises);

    // Process all results
    for (const settledResult of settledResults) {
      if (settledResult.status === "fulfilled") {
        const { scraper, index, result } = settledResult.value;

        if (result.cancelled) {
          totalCancelled++;
        } else if (result.error) {
          totalFailed++;
        } else {
          totalJobsFound += result.jobsFound;
          totalNewCompanies += result.newCompanies;
          totalLeadsCreated += result.leadsCreated;
        }
        totalCompaniesFound += result.companiesFound;

        // Merge company IDs
        for (const [key, value] of result.companyIdMap) {
          companyIdMap.set(key, value);
        }

        scraperResults.push({
          scraperIndex: index,
          scraperConfig: scraper,
          scraperRunId: result.scraperRunId,
          jobsFound: result.jobsFound,
          newCompanies: result.newCompanies,
          leadsCreated: result.leadsCreated,
          error: result.error,
          cancelled: result.cancelled,
        });
      } else {
        // Promise was rejected (unexpected error)
        console.error(`[Search Run] Scraper promise rejected:`, settledResult.reason);
        totalFailed++;

        // Try to find the index from the error context
        const errorMessage = settledResult.reason instanceof Error
          ? settledResult.reason.message
          : "Unknown error";

        // We can't easily get the index here, so we'll log the error
        console.error(`[Search Run] Unexpected scraper failure: ${errorMessage}`);
      }
    }

    console.log(`[Search Run] Parallel execution complete. Success: ${scraperResults.filter(r => !r.error && !r.cancelled).length}, Failed: ${totalFailed}, Cancelled: ${totalCancelled}`);

    // Update search with aggregated results
    await db
      .update(searches)
      .set({
        resultsCount: sql`COALESCE(${searches.resultsCount}, 0) + ${totalNewCompanies}`,
        jobsCount: sql`COALESCE(${searches.jobsCount}, 0) + ${totalJobsFound}`,
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(searches.id, id));

    // Deduct ICP credits for new companies found (1 credit per company)
    if (totalNewCompanies > 0) {
      console.log(`[Search Run] Deducting ${totalNewCompanies} ICP credits for new companies`);

      // Update credit usage
      const [updatedCredits] = await db
        .update(creditUsage)
        .set({
          icpUsed: sql`${creditUsage.icpUsed} + ${totalNewCompanies}`,
          updatedAt: new Date(),
        })
        .where(eq(creditUsage.orgId, orgId))
        .returning();

      // Record credit history
      await db.insert(creditHistory).values({
        orgId,
        userId,
        creditType: "icp",
        transactionType: "scraper_run",
        creditsUsed: totalNewCompanies,
        balanceAfter: updatedCredits ? updatedCredits.icpLimit - updatedCredits.icpUsed : null,
        description: `Scraper run for "${search.name}" - found ${totalNewCompanies} new companies`,
        searchId: id,
        metadata: {
          companiesReturned: totalNewCompanies,
          scraperConfig: scrapersToRun.length === 1
            ? { jobTitle: scrapersToRun[0].scraper.jobTitle, location: scrapersToRun[0].scraper.location }
            : undefined,
        },
      });
    }

    console.log(`[Search Run] Completed: ${totalJobsFound} jobs, ${totalNewCompanies} new companies, ${totalLeadsCreated} leads`);

    return NextResponse.json({
      success: true,
      scrapersRun: scrapersToRun.length,
      totalJobsFound,
      totalCompaniesFound,
      totalNewCompanies,
      totalLeadsCreated,
      scraperResults,
    });
  } catch (error) {
    console.error("Error running search:", error);
    return NextResponse.json(
      {
        error: "Failed to run search",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
