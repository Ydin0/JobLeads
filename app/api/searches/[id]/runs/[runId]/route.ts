import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches, scraperRuns } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string; runId: string }> };

// DELETE /api/searches/[id]/runs/[runId] - Cancel a queued scraper run
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id: searchId, runId } = await params;

    // Verify the search exists and belongs to this org
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, searchId), eq(searches.orgId, orgId)),
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    // Find the scraper run
    const scraperRun = await db.query.scraperRuns.findFirst({
      where: and(
        eq(scraperRuns.id, runId),
        eq(scraperRuns.searchId, searchId)
      ),
    });

    if (!scraperRun) {
      return NextResponse.json({ error: "Scraper run not found" }, { status: 404 });
    }

    // Only allow cancellation of queued runs
    if (scraperRun.status !== "queued") {
      return NextResponse.json(
        { error: `Cannot cancel scraper run with status: ${scraperRun.status}. Only queued runs can be cancelled.` },
        { status: 400 }
      );
    }

    // Update status to cancelled
    await db
      .update(scraperRuns)
      .set({
        status: "cancelled",
        completedAt: new Date(),
      })
      .where(eq(scraperRuns.id, runId));

    console.log(`[Scraper Run] Cancelled queued run ${runId} for search ${searchId}`);

    return NextResponse.json({
      success: true,
      message: "Scraper run cancelled",
      runId,
    });
  } catch (error) {
    console.error("Error cancelling scraper run:", error);
    return NextResponse.json(
      {
        error: "Failed to cancel scraper run",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/searches/[id]/runs/[runId] - Get a specific scraper run
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id: searchId, runId } = await params;

    // Verify the search exists and belongs to this org
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, searchId), eq(searches.orgId, orgId)),
    });

    if (!search) {
      return NextResponse.json({ error: "Search not found" }, { status: 404 });
    }

    // Find the scraper run
    const scraperRun = await db.query.scraperRuns.findFirst({
      where: and(
        eq(scraperRuns.id, runId),
        eq(scraperRuns.searchId, searchId)
      ),
    });

    if (!scraperRun) {
      return NextResponse.json({ error: "Scraper run not found" }, { status: 404 });
    }

    return NextResponse.json(scraperRun);
  } catch (error) {
    console.error("Error fetching scraper run:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch scraper run",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
