import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/companies - List all companies for the organization
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    const results = await db.query.companies.findMany({
      where: eq(companies.orgId, orgId),
      orderBy: [desc(companies.createdAt)],
      with: {
        search: true,
      },
    });

    return NextResponse.json(results);
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
