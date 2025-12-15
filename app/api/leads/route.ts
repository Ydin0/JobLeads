import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// GET /api/leads - List all leads for the organization
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    const results = await db.query.leads.findMany({
      where: eq(leads.orgId, orgId),
      orderBy: [desc(leads.createdAt)],
      with: {
        company: true,
        search: true,
      },
    });

    return NextResponse.json(results);
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
