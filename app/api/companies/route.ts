import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc, count } from "drizzle-orm";

// GET /api/companies - List all companies for the organization with pagination
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(companies)
      .where(eq(companies.orgId, orgId));

    // Get companies with employees count and jobs
    const results = await db.query.companies.findMany({
      where: eq(companies.orgId, orgId),
      orderBy: [desc(companies.createdAt)],
      limit,
      offset,
      with: {
        search: true,
        employees: true,
        leads: true,
        jobs: true,
      },
    });

    // Calculate date 30 days ago for hiring velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Transform to include counts and hiring signals
    const companiesWithSignals = results.map((company) => {
      const jobs = company.jobs || [];
      const recentJobs = jobs.filter(
        job => job.publishedAt && new Date(job.publishedAt) >= thirtyDaysAgo
      );

      // Count jobs by department
      const departmentCounts: Record<string, number> = {};
      for (const job of jobs) {
        const dept = job.department || "other";
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      }

      // Aggregate tech stack mentions (top 5)
      const techCounts: Record<string, number> = {};
      for (const job of jobs) {
        const techStack = job.techStack as string[] | null;
        if (techStack) {
          for (const tech of techStack) {
            techCounts[tech] = (techCounts[tech] || 0) + 1;
          }
        }
      }
      const topTech = Object.entries(techCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tech]) => tech);

      return {
        ...company,
        employeesCount: company.employees?.length || 0,
        leadsCount: company.leads?.length || 0,
        // Hiring signals
        hiringSignals: {
          totalJobs: jobs.length,
          recentJobs: recentJobs.length,
          departmentBreakdown: departmentCounts,
          topTech,
          hiringIntensity: Math.min(100, recentJobs.length * 10),
        },
        // Remove arrays to keep response small
        employees: undefined,
        leads: undefined,
        jobs: undefined,
      };
    });

    return NextResponse.json({
      companies: companiesWithSignals,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const body = await req.json();

    const {
      searchId,
      name,
      domain,
      industry,
      size,
      location,
      description,
      logoUrl,
      linkedinUrl,
      websiteUrl,
      metadata,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [newCompany] = await db
      .insert(companies)
      .values({
        orgId,
        searchId,
        name,
        domain,
        industry,
        size,
        location,
        description,
        logoUrl,
        linkedinUrl,
        websiteUrl,
        metadata,
      })
      .returning();

    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
