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

    // Get companies with employees count
    const results = await db.query.companies.findMany({
      where: eq(companies.orgId, orgId),
      orderBy: [desc(companies.createdAt)],
      limit,
      offset,
      with: {
        search: true,
        employees: true,
        leads: true,
      },
    });

    // Transform to include employeesCount and leadsCount
    const companiesWithCounts = results.map((company) => ({
      ...company,
      employeesCount: company.employees?.length || 0,
      leadsCount: company.leads?.length || 0,
      employees: undefined, // Remove arrays to keep response small
      leads: undefined,
    }));

    return NextResponse.json({
      companies: companiesWithCounts,
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
