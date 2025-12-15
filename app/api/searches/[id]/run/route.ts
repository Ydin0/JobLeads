import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches, companies, jobs } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import {
  runLinkedInJobsSearch,
  extractCompaniesFromJobs,
  LinkedInJobsInput,
} from "@/lib/apify";

// Extend timeout for Apify actor runs (can take several minutes)
export const maxDuration = 300; // 5 minutes

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/searches/[id]/run - Execute a search and store results
export async function POST(req: Request, { params }: RouteContext) {
  try {
    console.log("[Search Run] Starting search execution...");
    const { orgId } = await requireOrgAuth();
    const { id } = await params;
    console.log("[Search Run] Org ID:", orgId, "Search ID:", id);

    // Get the search
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, id), eq(searches.orgId, orgId)),
    });

    if (!search) {
      console.log("[Search Run] Search not found");
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }
    console.log("[Search Run] Found search:", search.name);

    // Build Apify input from search filters
    const filters = search.filters as {
      jobTitles?: string[];
      locations?: string[];
      companyNames?: string[];
      companyIds?: string[];
      keywords?: string[];
    } | null;

    const apifyInput: LinkedInJobsInput = {
      title: filters?.jobTitles?.join(" OR ") || filters?.keywords?.join(" OR ") || "",
      location: filters?.locations?.[0] || "",
      companyName: filters?.companyNames || [],
      companyId: filters?.companyIds || [],
      rows: 100,
    };
    console.log("[Search Run] Apify input:", JSON.stringify(apifyInput, null, 2));

    // Run the LinkedIn Jobs search
    console.log("[Search Run] Starting Apify actor... (this may take a few minutes)");
    const jobResults = await runLinkedInJobsSearch(apifyInput);
    console.log("[Search Run] Apify returned", jobResults.length, "jobs");

    // Extract unique companies from results
    const extractedCompanies = extractCompaniesFromJobs(jobResults);

    // Store companies in database and track their IDs
    const companyIdMap = new Map<string, string>(); // companyName -> companyId
    const insertedCompanies = [];

    for (const company of extractedCompanies) {
      const [inserted] = await db
        .insert(companies)
        .values({
          orgId,
          searchId: id,
          name: company.name,
          linkedinUrl: company.linkedinUrl,
          logoUrl: company.logoUrl,
          metadata: {
            linkedinId: company.linkedinId,
            jobCount: company.jobCount,
          },
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        insertedCompanies.push(inserted);
        companyIdMap.set(company.name.toLowerCase(), inserted.id);
      }
    }
    console.log("[Search Run] Stored", insertedCompanies.length, "companies");

    // Store jobs in database
    let jobsStored = 0;
    for (const job of jobResults) {
      if (!job.companyName) continue;

      const companyId = companyIdMap.get(job.companyName.toLowerCase());
      if (!companyId) continue;

      try {
        await db.insert(jobs).values({
          orgId,
          companyId,
          searchId: id,
          externalId: job.id?.toString(),
          title: job.title,
          jobUrl: job.jobUrl,
          location: job.location,
          salary: job.salary,
          contractType: job.contractType,
          experienceLevel: job.experienceLevel,
          workType: job.workType,
          sector: job.sector,
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
    console.log("[Search Run] Stored", jobsStored, "jobs");

    // Update search with results count and last run time
    await db
      .update(searches)
      .set({
        resultsCount: insertedCompanies.length,
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(searches.id, id));

    return NextResponse.json({
      success: true,
      jobsFound: jobResults.length,
      companiesFound: extractedCompanies.length,
      companiesStored: insertedCompanies.length,
      jobsStored,
      companies: insertedCompanies,
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
