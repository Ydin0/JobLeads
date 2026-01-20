import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc, and, count } from "drizzle-orm";

// GET /api/jobs - List jobs for the organization with pagination
// Query params: searchId, page, limit
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);
    const searchId = searchParams.get('searchId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '100')));
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(jobs.orgId, orgId)];

    // Filter by searchId (ICP) if provided
    if (searchId) {
      conditions.push(eq(jobs.searchId, searchId));
    }

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(jobs)
      .where(and(...conditions));

    // Fetch paginated results
    const results = await db.query.jobs.findMany({
      where: and(...conditions),
      orderBy: [desc(jobs.createdAt)],
      with: {
        company: true,
      },
      limit,
      offset,
    });

    return NextResponse.json({
      jobs: results,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
