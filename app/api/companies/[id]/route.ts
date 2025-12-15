import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/companies/[id] - Get a single company
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    const company = await db.query.companies.findFirst({
      where: and(eq(companies.id, id), eq(companies.orgId, orgId)),
      with: {
        search: true,
        leads: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// PATCH /api/companies/[id] - Update a company
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;
    const body = await req.json();

    const {
      name,
      domain,
      industry,
      size,
      location,
      description,
      logoUrl,
      linkedinUrl,
      websiteUrl,
      isEnriched,
      metadata,
    } = body;

    const [updated] = await db
      .update(companies)
      .set({
        ...(name && { name }),
        ...(domain !== undefined && { domain }),
        ...(industry !== undefined && { industry }),
        ...(size !== undefined && { size }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(websiteUrl !== undefined && { websiteUrl }),
        ...(isEnriched !== undefined && { isEnriched }),
        ...(isEnriched && { enrichedAt: new Date() }),
        ...(metadata && { metadata }),
        updatedAt: new Date(),
      })
      .where(and(eq(companies.id, id), eq(companies.orgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// DELETE /api/companies/[id] - Delete a company
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    const [deleted] = await db
      .delete(companies)
      .where(and(eq(companies.id, id), eq(companies.orgId, orgId)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
