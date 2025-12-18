import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, employees, jobs } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, sql, desc, ilike, inArray } from "drizzle-orm";

// GET /api/prospects - Unified endpoint for people and companies
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);

    // Core params
    const view = (searchParams.get("view") || "people") as "people" | "companies";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;
    const search = searchParams.get("search") || "";

    // Common filters (JSON encoded)
    const filtersParam = searchParams.get("filters");
    const filters = filtersParam ? JSON.parse(filtersParam) : {};

    if (view === "people") {
      return await getPeopleProspects(orgId, page, limit, offset, search, filters);
    } else {
      return await getCompanyProspects(orgId, page, limit, offset, search, filters);
    }
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return NextResponse.json(
      { error: "Failed to fetch prospects" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// Get people prospects
async function getPeopleProspects(
  orgId: string,
  page: number,
  limit: number,
  offset: number,
  search: string,
  filters: {
    jobTitles?: string[];
    seniorities?: string[];
    departments?: string[];
    companyIds?: string[];
    locations?: string[];
    isShortlisted?: boolean;
  }
) {
  // Build where conditions
  const conditions = [eq(employees.orgId, orgId)];

  // Search across name, job title, email
  if (search) {
    conditions.push(
      sql`(
        ${employees.firstName} ILIKE ${`%${search}%`} OR
        ${employees.lastName} ILIKE ${`%${search}%`} OR
        ${employees.jobTitle} ILIKE ${`%${search}%`} OR
        ${employees.email} ILIKE ${`%${search}%`}
      )`
    );
  }

  // Job title filter (partial match on any)
  if (filters.jobTitles && filters.jobTitles.length > 0) {
    const titleConditions = filters.jobTitles.map(
      (title) => ilike(employees.jobTitle, `%${title}%`)
    );
    conditions.push(sql`(${sql.join(titleConditions, sql` OR `)})`);
  }

  // Seniority filter
  if (filters.seniorities && filters.seniorities.length > 0) {
    conditions.push(inArray(employees.seniority, filters.seniorities));
  }

  // Department filter
  if (filters.departments && filters.departments.length > 0) {
    conditions.push(inArray(employees.department, filters.departments));
  }

  // Company filter
  if (filters.companyIds && filters.companyIds.length > 0) {
    conditions.push(inArray(employees.companyId, filters.companyIds));
  }

  // Location filter
  if (filters.locations && filters.locations.length > 0) {
    const locationConditions = filters.locations.map(
      (loc) => ilike(employees.location, `%${loc}%`)
    );
    conditions.push(sql`(${sql.join(locationConditions, sql` OR `)})`);
  }

  // Lead status filter
  if (filters.isShortlisted !== undefined) {
    conditions.push(eq(employees.isShortlisted, filters.isShortlisted));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employees)
    .where(and(...conditions));
  const totalCount = countResult[0]?.count || 0;

  // Get stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const statsResult = await db
    .select({
      total: sql<number>`count(*)::int`,
      netNew: sql<number>`count(*) FILTER (WHERE ${employees.createdAt} >= ${sevenDaysAgo})::int`,
      withEmail: sql<number>`count(*) FILTER (WHERE ${employees.email} IS NOT NULL AND ${employees.email} != '')::int`,
      leads: sql<number>`count(*) FILTER (WHERE ${employees.isShortlisted} = true)::int`,
    })
    .from(employees)
    .where(eq(employees.orgId, orgId));

  const stats = statsResult[0] || { total: 0, netNew: 0, withEmail: 0, leads: 0 };

  // Get employees with company info
  const results = await db
    .select({
      employee: employees,
      company: {
        id: companies.id,
        name: companies.name,
        logoUrl: companies.logoUrl,
        industry: companies.industry,
        domain: companies.domain,
      },
    })
    .from(employees)
    .leftJoin(companies, eq(employees.companyId, companies.id))
    .where(and(...conditions))
    .orderBy(desc(employees.createdAt))
    .limit(limit)
    .offset(offset);

  // Transform results
  const data = results.map(({ employee, company }) => ({
    ...employee,
    company: company || null,
  }));

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    stats: {
      total: stats.total,
      netNew: stats.netNew,
      enriched: stats.withEmail,
      leads: stats.leads,
    },
  });
}

// Get company prospects
async function getCompanyProspects(
  orgId: string,
  page: number,
  limit: number,
  offset: number,
  search: string,
  filters: {
    industries?: string[];
    sizes?: string[];
    locations?: string[];
    isEnriched?: boolean;
    hasContacts?: boolean;
  }
) {
  // Build where conditions
  const conditions = [eq(companies.orgId, orgId)];

  // Search on company name
  if (search) {
    conditions.push(
      sql`(
        ${companies.name} ILIKE ${`%${search}%`} OR
        ${companies.domain} ILIKE ${`%${search}%`} OR
        ${companies.industry} ILIKE ${`%${search}%`}
      )`
    );
  }

  // Industry filter
  if (filters.industries && filters.industries.length > 0) {
    conditions.push(inArray(companies.industry, filters.industries));
  }

  // Size filter
  if (filters.sizes && filters.sizes.length > 0) {
    conditions.push(inArray(companies.size, filters.sizes));
  }

  // Location filter
  if (filters.locations && filters.locations.length > 0) {
    const locationConditions = filters.locations.map(
      (loc) => ilike(companies.location, `%${loc}%`)
    );
    conditions.push(sql`(${sql.join(locationConditions, sql` OR `)})`);
  }

  // Enrichment status filter
  if (filters.isEnriched !== undefined) {
    conditions.push(eq(companies.isEnriched, filters.isEnriched));
  }

  // Has contacts filter (subquery)
  if (filters.hasContacts === true) {
    conditions.push(
      sql`(SELECT COUNT(*) FROM employees WHERE employees.company_id = ${companies.id}) > 0`
    );
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(companies)
    .where(and(...conditions));
  const totalCount = countResult[0]?.count || 0;

  // Get stats
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const statsResult = await db
    .select({
      total: sql<number>`count(*)::int`,
      netNew: sql<number>`count(*) FILTER (WHERE ${companies.createdAt} >= ${sevenDaysAgo})::int`,
      enriched: sql<number>`count(*) FILTER (WHERE ${companies.isEnriched} = true)::int`,
    })
    .from(companies)
    .where(eq(companies.orgId, orgId));

  const stats = statsResult[0] || { total: 0, netNew: 0, enriched: 0 };

  // Get companies with counts via subqueries
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
      employeesCount: sql<number>`(SELECT COUNT(*) FROM employees WHERE employees.company_id = ${companies.id})::int`.as("employees_count"),
      leadsCount: sql<number>`(SELECT COUNT(*) FROM leads WHERE leads.company_id = ${companies.id})::int`.as("leads_count"),
      jobsCount: sql<number>`(SELECT COUNT(*) FROM jobs WHERE jobs.company_id = ${companies.id})::int`.as("jobs_count"),
    })
    .from(companies)
    .where(and(...conditions))
    .orderBy(desc(companies.createdAt))
    .limit(limit)
    .offset(offset);

  // Get company IDs for job enrichment
  const companyIds = results.map((c) => c.id);

  // Fetch jobs for hiring signals
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
  const data = results.map((company) => {
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
    data,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    stats: {
      total: stats.total,
      netNew: stats.netNew,
      enriched: stats.enriched,
      leads: 0, // Companies don't have leads count
    },
  });
}

// POST /api/prospects - Bulk actions (promote to leads, enrich)
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const body = await req.json();
    const { action, ids } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "action and ids array are required" },
        { status: 400 }
      );
    }

    if (action === "promoteToLeads") {
      // Reuse existing employee promotion logic
      const { leads } = await import("@/lib/db/schema");

      const employeesToPromote = await db.query.employees.findMany({
        where: and(
          eq(employees.orgId, orgId),
          inArray(employees.id, ids)
        ),
      });

      if (employeesToPromote.length === 0) {
        return NextResponse.json(
          { error: "No valid employees found" },
          { status: 404 }
        );
      }

      const createdLeads = [];

      for (const employee of employeesToPromote) {
        try {
          const [newLead] = await db
            .insert(leads)
            .values({
              orgId,
              companyId: employee.companyId,
              employeeId: employee.id,
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              phone: employee.phone,
              jobTitle: employee.jobTitle,
              linkedinUrl: employee.linkedinUrl,
              location: employee.location,
              status: "new",
              metadata: {
                promotedFromEmployee: true,
                promotedAt: new Date().toISOString(),
                seniority: employee.seniority,
                department: employee.department,
              },
            })
            .returning();

          await db
            .update(employees)
            .set({ isShortlisted: true, updatedAt: new Date() })
            .where(eq(employees.id, employee.id));

          createdLeads.push(newLead);
        } catch (err) {
          console.error("[Promote] Error:", employee.id, err);
        }
      }

      return NextResponse.json({
        success: true,
        action: "promoteToLeads",
        count: createdLeads.length,
      });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in prospects action:", error);
    return NextResponse.json(
      { error: "Failed to perform action" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
