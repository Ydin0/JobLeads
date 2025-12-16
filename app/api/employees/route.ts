import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employees, leads, companies } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, inArray, ilike, sql } from "drizzle-orm";

// GET /api/employees - Get all employees with optional filters
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);

    // Pagination params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Filter params
    const companyId = searchParams.get("companyId");
    const seniority = searchParams.get("seniority");
    const jobTitle = searchParams.get("jobTitle");
    const location = searchParams.get("location");
    const search = searchParams.get("search");
    const showLeadsOnly = searchParams.get("showLeadsOnly") === "true";

    // Build where conditions
    const conditions = [eq(employees.orgId, orgId)];

    if (companyId) {
      conditions.push(eq(employees.companyId, companyId));
    }

    if (seniority) {
      conditions.push(eq(employees.seniority, seniority));
    }

    if (jobTitle) {
      conditions.push(ilike(employees.jobTitle, `%${jobTitle}%`));
    }

    if (location) {
      conditions.push(ilike(employees.location, `%${location}%`));
    }

    if (search) {
      // Search across name, job title, email
      conditions.push(
        sql`(
          ${employees.firstName} ILIKE ${`%${search}%`} OR
          ${employees.lastName} ILIKE ${`%${search}%`} OR
          ${employees.jobTitle} ILIKE ${`%${search}%`} OR
          ${employees.email} ILIKE ${`%${search}%`}
        )`
      );
    }

    if (showLeadsOnly) {
      conditions.push(eq(employees.isShortlisted, true));
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(and(...conditions));
    const totalCount = countResult[0]?.count || 0;

    // Get employees with company info
    const results = await db
      .select({
        employee: employees,
        company: {
          id: companies.id,
          name: companies.name,
          logoUrl: companies.logoUrl,
          industry: companies.industry,
        },
      })
      .from(employees)
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(sql`${employees.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    // Transform results to flatten structure
    const employeesWithCompany = results.map(({ employee, company }) => ({
      ...employee,
      company: company || null,
    }));

    return NextResponse.json({
      employees: employeesWithCompany,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST /api/employees - Promote employees to leads
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const body = await req.json();
    const { employeeIds } = body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: "employeeIds array is required" },
        { status: 400 }
      );
    }

    // Get the employees to promote
    const employeesToPromote = await db.query.employees.findMany({
      where: and(
        eq(employees.orgId, orgId),
        inArray(employees.id, employeeIds)
      ),
    });

    if (employeesToPromote.length === 0) {
      return NextResponse.json(
        { error: "No valid employees found" },
        { status: 404 }
      );
    }

    const createdLeads = [];

    // Create leads from employees
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

        // Mark employee as shortlisted
        await db
          .update(employees)
          .set({ isShortlisted: true, updatedAt: new Date() })
          .where(eq(employees.id, employee.id));

        createdLeads.push(newLead);
      } catch (err) {
        console.error("[Promote Employee] Error promoting employee:", employee.id, err);
      }
    }

    return NextResponse.json({
      success: true,
      leadsCreated: createdLeads.length,
      leads: createdLeads,
    });
  } catch (error) {
    console.error("Error promoting employees:", error);
    return NextResponse.json(
      { error: "Failed to promote employees to leads" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
