import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { isNotNull } from "drizzle-orm";

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

// POST /api/migrate-posters - One-time migration of job posters to leads
export async function POST() {
  try {
    const { orgId } = await requireOrgAuth();

    // Get all jobs with poster info that belong to this org
    const jobsWithPosters = await db.query.jobs.findMany({
      where: isNotNull(jobs.posterName),
      columns: {
        id: true,
        orgId: true,
        companyId: true,
        searchId: true,
        posterName: true,
        posterUrl: true,
        title: true,
        jobUrl: true,
      },
    });

    // Filter to only this org's jobs
    const orgJobs = jobsWithPosters.filter(job => job.orgId === orgId);

    console.log(`[Migration] Found ${orgJobs.length} jobs with poster info for org ${orgId}`);

    // Track unique posters by LinkedIn URL to avoid duplicates
    const seenPosterUrls = new Set<string>();
    let leadsCreated = 0;
    let skipped = 0;

    for (const job of orgJobs) {
      // Skip if no poster URL or already processed
      if (!job.posterName || !job.posterUrl) {
        skipped++;
        continue;
      }
      if (seenPosterUrls.has(job.posterUrl)) {
        skipped++;
        continue;
      }
      seenPosterUrls.add(job.posterUrl);

      if (!job.companyId) {
        skipped++;
        continue;
      }

      try {
        const { firstName, lastName } = parseFullName(job.posterName);

        await db.insert(leads).values({
          orgId,
          companyId: job.companyId,
          searchId: job.searchId,
          firstName,
          lastName,
          linkedinUrl: job.posterUrl,
          jobTitle: "Job Poster",
          status: "new",
          metadata: {
            source: "linkedin_job_poster",
            jobTitle: job.title,
            jobUrl: job.jobUrl,
            migratedFromJobId: job.id,
          },
        }).onConflictDoNothing();
        leadsCreated++;
      } catch (err) {
        console.error("[Migration] Error creating lead:", err);
      }
    }

    console.log(`[Migration] Created ${leadsCreated} leads, skipped ${skipped}`);

    return NextResponse.json({
      success: true,
      jobsProcessed: orgJobs.length,
      leadsCreated,
      skipped,
    });
  } catch (error) {
    console.error("Error migrating posters:", error);
    return NextResponse.json(
      {
        error: "Failed to migrate posters",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
