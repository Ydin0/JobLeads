import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, companies, searches } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, count, desc, and, isNotNull } from "drizzle-orm";

// GET /api/dashboard/stats - Get dashboard statistics (counts only)
// This is optimized for the dashboard to avoid fetching all records
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    // Run all count queries in parallel for better performance
    const [
      [{ value: totalLeads }],
      [{ value: totalCompanies }],
      [{ value: totalSearches }],
      recentLeads,
      recentSearches,
      recentEnrichedCompanies,
    ] = await Promise.all([
      // Total leads count
      db.select({ value: count() })
        .from(leads)
        .where(eq(leads.orgId, orgId)),

      // Total companies count
      db.select({ value: count() })
        .from(companies)
        .where(eq(companies.orgId, orgId)),

      // Total searches/ICPs count
      db.select({ value: count() })
        .from(searches)
        .where(eq(searches.orgId, orgId)),

      // Recent leads (just 5, for activity feed)
      db.query.leads.findMany({
        where: eq(leads.orgId, orgId),
        orderBy: [desc(leads.createdAt)],
        limit: 5,
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),

      // Recent search runs (just 3, for activity feed)
      db.query.searches.findMany({
        where: and(
          eq(searches.orgId, orgId),
          isNotNull(searches.lastRunAt)
        ),
        orderBy: [desc(searches.lastRunAt)],
        limit: 3,
        columns: {
          id: true,
          name: true,
          lastRunAt: true,
          resultsCount: true,
        },
      }),

      // Recent enriched companies (just 3, for activity feed)
      db.query.companies.findMany({
        where: and(
          eq(companies.orgId, orgId),
          isNotNull(companies.enrichedAt)
        ),
        orderBy: [desc(companies.enrichedAt)],
        limit: 3,
        columns: {
          id: true,
          name: true,
          enrichedAt: true,
          isEnriched: true,
        },
      }),
    ]);

    return NextResponse.json({
      counts: {
        leads: totalLeads,
        companies: totalCompanies,
        searches: totalSearches,
      },
      recentActivity: {
        leads: recentLeads,
        searches: recentSearches,
        enrichedCompanies: recentEnrichedCompanies,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
