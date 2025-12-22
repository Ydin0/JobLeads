import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, jobs } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc, count, and, sql, inArray } from "drizzle-orm";

// GET /api/companies - List all companies for the organization with pagination
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;
    const searchId = searchParams.get("searchId");

    // Filter parameters (comma-separated for multi-select)
    const sizeFilter = searchParams.get("size");
    const industryFilter = searchParams.get("industry");
    const locationFilter = searchParams.get("location");

    // Build base where clause (always filter by orgId, optionally by searchId)
    const baseConditions: ReturnType<typeof eq>[] = [eq(companies.orgId, orgId)];
    if (searchId) {
      baseConditions.push(eq(companies.searchId, searchId));
    }
    const baseWhereClause = and(...baseConditions);

    // Build filtered where clause (includes size, industry, location filters)
    const filterConditions = [...baseConditions];
    if (sizeFilter) {
      const sizes = sizeFilter.split(",").map(s => s.trim());
      filterConditions.push(inArray(companies.size, sizes));
    }
    if (industryFilter) {
      const industries = industryFilter.split(",").map(i => i.trim());
      filterConditions.push(inArray(companies.industry, industries));
    }
    if (locationFilter) {
      const locations = locationFilter.split(",").map(l => l.trim());
      filterConditions.push(inArray(companies.location, locations));
    }
    const filteredWhereClause = and(...filterConditions);

    // Get total count for pagination (with filters applied)
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(companies)
      .where(filteredWhereClause);

    // Get unique filter options for ALL companies (without filters - so users see all options)
    const [filterOptionsResult] = await db
      .select({
        sizes: sql<string[]>`COALESCE(array_agg(DISTINCT ${companies.size}) FILTER (WHERE ${companies.size} IS NOT NULL), ARRAY[]::text[])`,
        industries: sql<string[]>`COALESCE(array_agg(DISTINCT ${companies.industry}) FILTER (WHERE ${companies.industry} IS NOT NULL), ARRAY[]::text[])`,
        locations: sql<string[]>`COALESCE(array_agg(DISTINCT ${companies.location}) FILTER (WHERE ${companies.location} IS NOT NULL), ARRAY[]::text[])`,
      })
      .from(companies)
      .where(baseWhereClause);

    const filterOptions = {
      sizes: (filterOptionsResult?.sizes || []).sort(),
      industries: (filterOptionsResult?.industries || []).sort(),
      locations: (filterOptionsResult?.locations || []).sort(),
    };

    // Get companies with counts via subqueries (avoids N+1 queries)
    const results = await db
      .select({
        id: companies.id,
        orgId: companies.orgId,
        searchId: companies.searchId,
        name: companies.name,
        domain: companies.domain,
        industry: companies.industry,
        size: companies.size,
        location: companies.location,
        description: companies.description,
        logoUrl: companies.logoUrl,
        linkedinUrl: companies.linkedinUrl,
        websiteUrl: companies.websiteUrl,
        isEnriched: companies.isEnriched,
        enrichedAt: companies.enrichedAt,
        metadata: companies.metadata,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
        // Efficient count subqueries instead of loading all records
        // Cast to integer to ensure proper number type is returned
        employeesCount: sql<number>`COALESCE((SELECT COUNT(*)::int FROM employees WHERE employees.company_id = ${companies.id}), 0)`.as("employees_count"),
        leadsCount: sql<number>`COALESCE((SELECT COUNT(*)::int FROM leads WHERE leads.company_id = ${companies.id}), 0)`.as("leads_count"),
        jobsCount: sql<number>`COALESCE((SELECT COUNT(*)::int FROM jobs WHERE jobs.company_id = ${companies.id}), 0)`.as("jobs_count"),
      })
      .from(companies)
      .where(filteredWhereClause)
      .orderBy(desc(companies.createdAt))
      .limit(limit)
      .offset(offset);

    // Get company IDs from paginated results
    const companyIds = results.map((c) => c.id);

    // Fetch jobs only for the paginated companies (single query instead of N queries)
    let jobsForCompanies: typeof jobs.$inferSelect[] = [];
    if (companyIds.length > 0) {
      jobsForCompanies = await db
        .select()
        .from(jobs)
        .where(inArray(jobs.companyId, companyIds));
    }

    // Group jobs by company ID
    const jobsByCompanyId = new Map<string, typeof jobs.$inferSelect[]>();
    for (const job of jobsForCompanies) {
      if (job.companyId) {
        const existing = jobsByCompanyId.get(job.companyId) || [];
        existing.push(job);
        jobsByCompanyId.set(job.companyId, existing);
      }
    }

    // Calculate date 30 days ago for hiring velocity
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Transform to include hiring signals
    const companiesWithSignals = results.map((company) => {
      const companyJobs = jobsByCompanyId.get(company.id) || [];
      const recentJobs = companyJobs.filter(
        (job) => job.publishedAt && new Date(job.publishedAt) >= thirtyDaysAgo
      );

      // Count jobs by department
      const departmentCounts: Record<string, number> = {};
      for (const job of companyJobs) {
        const dept = job.department || "other";
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      }

      // Aggregate tech stack mentions (top 5)
      const techCounts: Record<string, number> = {};
      for (const job of companyJobs) {
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
        // Hiring signals
        hiringSignals: {
          totalJobs: companyJobs.length,
          recentJobs: recentJobs.length,
          departmentBreakdown: departmentCounts,
          topTech,
          hiringIntensity: Math.min(100, recentJobs.length * 10),
        },
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
      filterOptions,
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
