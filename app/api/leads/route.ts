import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc, and, count } from "drizzle-orm";

// GET /api/leads - List leads for the organization with pagination
// Query params: searchId, page, limit
export async function GET(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const { searchParams } = new URL(req.url);
    const searchId = searchParams.get('searchId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [eq(leads.orgId, orgId)];

    // Filter by searchId (ICP) if provided
    if (searchId) {
      conditions.push(eq(leads.searchId, searchId));
    }

    // Get total count for pagination
    const [{ value: totalCount }] = await db
      .select({ value: count() })
      .from(leads)
      .where(and(...conditions));

    // Fetch paginated results
    const results = await db.query.leads.findMany({
      where: and(...conditions),
      orderBy: [desc(leads.createdAt)],
      with: {
        company: true,
        search: true,
      },
      limit,
      offset,
    });

    return NextResponse.json({
      leads: results,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST /api/leads - Create a new lead
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();
    const body = await req.json();

    const {
      companyId,
      searchId,
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      linkedinUrl,
      location,
      notes,
      metadata,
    } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    const [newLead] = await db
      .insert(leads)
      .values({
        orgId,
        companyId,
        searchId,
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        linkedinUrl,
        location,
        notes,
        metadata,
      })
      .returning();

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Failed to create lead" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
