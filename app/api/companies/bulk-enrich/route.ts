import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireAdminAuth } from "@/lib/auth";
import { isNotNull, and, eq } from "drizzle-orm";
import { enrichCompaniesInBatch } from "@/lib/company-enrichment";

// Extend timeout for bulk operations
export const maxDuration = 300; // 5 minutes

// POST /api/companies/bulk-enrich - Enrich all companies with LinkedIn URLs
export async function POST(req: Request) {
  try {
    // Require admin access for bulk operations
    const { orgId } = await requireAdminAuth();

    // Get options from request body
    const body = await req.json().catch(() => ({}));
    const {
      onlyUnenriched = false,  // Only enrich companies that haven't been enriched
      limit = 100,             // Max companies to process
    } = body;

    console.log(`[Bulk Enrich] Starting bulk enrichment for org ${orgId}`);
    console.log(`[Bulk Enrich] Options: onlyUnenriched=${onlyUnenriched}, limit=${limit}`);

    // Build query conditions
    const conditions = [
      eq(companies.orgId, orgId),
      isNotNull(companies.linkedinUrl),
    ];

    if (onlyUnenriched) {
      conditions.push(eq(companies.isEnriched, false));
    }

    // Get companies with LinkedIn URLs
    const companiesToEnrich = await db
      .select({
        id: companies.id,
        name: companies.name,
        linkedinUrl: companies.linkedinUrl,
        isEnriched: companies.isEnriched,
      })
      .from(companies)
      .where(and(...conditions))
      .limit(limit);

    console.log(`[Bulk Enrich] Found ${companiesToEnrich.length} companies to enrich`);

    if (companiesToEnrich.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No companies to enrich",
        companiesProcessed: 0,
        successful: 0,
        failed: 0,
        cacheHits: 0,
      });
    }

    // Run batch enrichment
    const results = await enrichCompaniesInBatch(
      companiesToEnrich.map((c) => ({
        companyId: c.id,
        name: c.name,
        linkedinUrl: c.linkedinUrl!,
      }))
    );

    // Calculate stats
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const cacheHits = results.filter((r) => r.cacheHit).length;

    console.log(`[Bulk Enrich] Completed: ${successful} successful, ${failed} failed, ${cacheHits} cache hits`);

    return NextResponse.json({
      success: true,
      message: `Enriched ${successful} companies`,
      companiesProcessed: companiesToEnrich.length,
      successful,
      failed,
      cacheHits,
      results: results.map((r) => ({
        companyId: r.companyId,
        success: r.success,
        cacheHit: r.cacheHit,
        error: r.error,
        companyName: r.enrichedData?.name,
      })),
    });
  } catch (error) {
    console.error("[Bulk Enrich] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to bulk enrich companies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/companies/bulk-enrich - Get stats on companies that can be enriched
export async function GET() {
  try {
    const { orgId } = await requireAdminAuth();

    // Count companies by enrichment status
    const allCompanies = await db
      .select({
        id: companies.id,
        linkedinUrl: companies.linkedinUrl,
        isEnriched: companies.isEnriched,
      })
      .from(companies)
      .where(eq(companies.orgId, orgId));

    const withLinkedIn = allCompanies.filter((c) => c.linkedinUrl);
    const enriched = withLinkedIn.filter((c) => c.isEnriched);
    const unenriched = withLinkedIn.filter((c) => !c.isEnriched);

    return NextResponse.json({
      totalCompanies: allCompanies.length,
      withLinkedInUrl: withLinkedIn.length,
      alreadyEnriched: enriched.length,
      pendingEnrichment: unenriched.length,
    });
  } catch (error) {
    console.error("[Bulk Enrich] Error getting stats:", error);
    return NextResponse.json(
      {
        error: "Failed to get enrichment stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
