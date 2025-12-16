import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { employees, leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";

// GET /api/employees - Get employees for a company
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    const results = await db.query.employees.findMany({
      where: and(
        eq(employees.orgId, orgId),
        eq(employees.companyId, companyId)
      ),
      orderBy: (employees, { desc }) => [desc(employees.createdAt)],
    });

    return NextResponse.json(results);
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
