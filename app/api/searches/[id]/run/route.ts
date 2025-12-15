import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches, companies } from "@/lib/db/schema";
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
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Get the search
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, id), eq(searches.orgId, orgId)),
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

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

    // Run the LinkedIn Jobs search
    const jobResults = await runLinkedInJobsSearch(apifyInput);

    // Extract unique companies from results
    const extractedCompanies = extractCompaniesFromJobs(jobResults);

    // Store companies in database
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
            jobs: company.jobs.map((job) => ({
              id: job.id,
              title: job.title,
              url: job.url,
              location: job.location,
              publishedAt: job.publishedAt,
              type: job.type,
              salary: job.salary,
            })),
          },
        })
        .onConflictDoNothing()
        .returning();

      if (inserted) {
        insertedCompanies.push(inserted);
      }
    }

    // Update search with results count and last run time
    await db
      .update(searches)
      .set({
        resultsCount: extractedCompanies.length,
        lastRunAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(searches.id, id));

    return NextResponse.json({
      success: true,
      jobsFound: jobResults.length,
      companiesFound: extractedCompanies.length,
      companiesStored: insertedCompanies.length,
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
