import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches, scraperRuns } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/searches/[id]/runs - Get scraper run history for a search
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Verify the search exists and belongs to this org
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, id), eq(searches.orgId, orgId)),
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    // Get all scraper runs for this search, ordered by most recent first
    const runs = await db.query.scraperRuns.findMany({
      where: eq(scraperRuns.searchId, id),
      orderBy: [desc(scraperRuns.startedAt)],
    });

    // Group runs by date for easier display
    const runsByDate: Record<string, typeof runs> = {};
    for (const run of runs) {
      const date = run.startedAt.toISOString().split("T")[0];
      if (!runsByDate[date]) {
        runsByDate[date] = [];
      }
      runsByDate[date].push(run);
    }

    return NextResponse.json({
      searchId: id,
      searchName: search.name,
      totalRuns: runs.length,
      runs,
      runsByDate,
    });
  } catch (error) {
    console.error("Error fetching scraper runs:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch scraper runs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
