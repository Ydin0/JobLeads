import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireOrgAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq, and, isNotNull, sql, or, count } from "drizzle-orm";
import { enrichCompaniesInBatch } from "@/lib/company-enrichment";

const PLATFORM_ADMIN_ORG = "Octogle Technologies";

// Helper to validate platform admin access
async function validatePlatformAdmin() {
  const { orgId } = await requireOrgAuth();
  const clerk = await clerkClient();
  const org = await clerk.organizations.getOrganization({ organizationId: orgId });

  if (org.name !== PLATFORM_ADMIN_ORG) {
    return { authorized: false, orgName: org.name };
  }

  return { authorized: true, orgName: org.name };
}

// GET /api/admin/bulk-enrich - Get enrichment stats
export async function GET() {
  try {
    const { authorized } = await validatePlatformAdmin();

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized - Platform admin access required" },
        { status: 403 }
      );
    }

    // Get stats across ALL organizations
    const [stats] = await db
      .select({
        total: count(),
        enriched: count(sql`CASE WHEN ${companies.isEnriched} = true THEN 1 END`),
        unenriched: count(
          sql`CASE WHEN ${companies.isEnriched} = false OR ${companies.isEnriched} IS NULL THEN 1 END`
        ),
        withLinkedIn: count(sql`CASE WHEN ${companies.linkedinUrl} IS NOT NULL THEN 1 END`),
        unenrichedWithLinkedIn: count(
          sql`CASE WHEN (${companies.isEnriched} = false OR ${companies.isEnriched} IS NULL)
              AND ${companies.linkedinUrl} IS NOT NULL THEN 1 END`
        ),
      })
      .from(companies);

    return NextResponse.json({
      total: stats.total,
      enriched: stats.enriched,
      unenriched: stats.unenriched,
      withLinkedIn: stats.withLinkedIn,
      unenrichedWithLinkedIn: stats.unenrichedWithLinkedIn,
    });
  } catch (error) {
    console.error("[Admin Bulk Enrich] Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch enrichment stats" },
      { status: 500 }
    );
  }
}

// POST /api/admin/bulk-enrich - Run bulk enrichment
export async function POST() {
  try {
    const { authorized } = await validatePlatformAdmin();

    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized - Platform admin access required" },
        { status: 403 }
      );
    }

    console.log("[Admin Bulk Enrich] Starting platform-wide enrichment...");

    // Fetch ALL unenriched companies with LinkedIn URLs (across all orgs)
    const unenrichedCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        linkedinUrl: companies.linkedinUrl,
        orgId: companies.orgId,
      })
      .from(companies)
      .where(
        and(
          or(
            eq(companies.isEnriched, false),
            sql`${companies.isEnriched} IS NULL`
          ),
          isNotNull(companies.linkedinUrl)
        )
      );

    console.log(`[Admin Bulk Enrich] Found ${unenrichedCompanies.length} unenriched companies with LinkedIn URLs`);

    if (unenrichedCompanies.length === 0) {
      return NextResponse.json({
        message: "No unenriched companies found",
        total: 0,
        successful: 0,
        failed: 0,
        cacheHits: 0,
      });
    }

    // Run enrichment using existing service
    const results = await enrichCompaniesInBatch(
      unenrichedCompanies.map((c) => ({
        companyId: c.id,
        name: c.name,
        linkedinUrl: c.linkedinUrl!,
      }))
    );

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const cacheHits = results.filter((r) => r.cacheHit).length;

    console.log(`[Admin Bulk Enrich] Completed: ${successful} successful, ${failed} failed, ${cacheHits} cache hits`);

    return NextResponse.json({
      message: "Bulk enrichment completed",
      total: unenrichedCompanies.length,
      successful,
      failed,
      cacheHits,
    });
  } catch (error) {
    console.error("[Admin Bulk Enrich] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to run bulk enrichment",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
