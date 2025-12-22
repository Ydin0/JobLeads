import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scraperRuns } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, lt, inArray } from "drizzle-orm";

// Stale run threshold - runs older than this in "running" state are considered stuck
const STALE_RUN_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/searches/[id]/runs/cleanup - Clean up stale scraper runs
export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    const staleThreshold = new Date(Date.now() - STALE_RUN_THRESHOLD_MS);

    // Find runs that are stuck in running/queued state for too long
    const staleRuns = await db
      .select({ id: scraperRuns.id, status: scraperRuns.status, startedAt: scraperRuns.startedAt })
      .from(scraperRuns)
      .where(
        and(
          eq(scraperRuns.searchId, id),
          eq(scraperRuns.orgId, orgId),
          inArray(scraperRuns.status, ["running", "queued"]),
          lt(scraperRuns.startedAt, staleThreshold)
        )
      );

    if (staleRuns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale runs found",
        cleanedUp: 0,
      });
    }

    console.log(`[Cleanup] Found ${staleRuns.length} stale scraper runs, marking as failed`);

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

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${staleRuns.length} stale scraper runs`,
      cleanedUp: staleRuns.length,
    });
  } catch (error) {
    console.error("Error cleaning up stale runs:", error);
    return NextResponse.json(
      { error: "Failed to cleanup stale runs" },
      { status: 500 }
    );
  }
}
