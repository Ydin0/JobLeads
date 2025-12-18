import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/jobs - List all jobs for the organization
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    const results = await db.query.jobs.findMany({
      where: eq(jobs.orgId, orgId),
      orderBy: [desc(jobs.createdAt)],
      with: {
        company: true,
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
