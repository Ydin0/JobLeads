import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jobs, companies } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, sql, gte } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/companies/[id]/signals - Get hiring signals for a company
export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Check company exists and belongs to org
    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get all jobs for this company
    const companyJobs = await db.query.jobs.findMany({
      where: eq(jobs.companyId, id),
      orderBy: (jobs, { desc }) => [desc(jobs.publishedAt)],
    });

    // Calculate hiring velocity (jobs in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentJobs = companyJobs.filter(
      job => job.publishedAt && new Date(job.publishedAt) >= thirtyDaysAgo
    );

    // Count jobs by department
    const departmentCounts: Record<string, number> = {};
    for (const job of companyJobs) {
      const dept = job.department || "other";
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
    }

    // Aggregate tech stack mentions
    const techCounts: Record<string, number> = {};
    for (const job of companyJobs) {
      const techStack = job.techStack as string[] | null;
      if (techStack) {
        for (const tech of techStack) {
          techCounts[tech] = (techCounts[tech] || 0) + 1;
        }
      }
    }

    // Sort tech by frequency and take top 10
    const topTech = Object.entries(techCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tech, count]) => ({ tech, count }));

    // Get recent job titles (last 5)
    const recentJobTitles = companyJobs.slice(0, 5).map(job => ({
      title: job.title,
      department: job.department,
      location: job.location,
      postedTime: job.postedTime,
      jobUrl: job.jobUrl,
    }));

    return NextResponse.json({
      companyId: id,
      companyName: company.name,
      signals: {
        totalJobs: companyJobs.length,
        recentJobs: recentJobs.length,
        hiringVelocity: recentJobs.length, // Jobs in last 30 days
        departmentBreakdown: departmentCounts,
        topTechStack: topTech,
        recentJobTitles,
        // Hiring intensity score (0-100)
        hiringIntensity: Math.min(100, recentJobs.length * 10),
      },
    });
  } catch (error) {
    console.error("Error fetching company signals:", error);
    return NextResponse.json(
      { error: "Failed to fetch company signals" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
