import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/leads/[id] - Get a single lead
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.orgId, orgId)),
      with: {
        company: true,
        search: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// PATCH /api/leads/[id] - Update a lead
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;
    const body = await req.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      linkedinUrl,
      location,
      status,
      notes,
      metadata,
    } = body;

    const [updated] = await db
      .update(leads)
      .set({
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(linkedinUrl !== undefined && { linkedinUrl }),
        ...(location !== undefined && { location }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(metadata && { metadata }),
        updatedAt: new Date(),
      })
      .where(and(eq(leads.id, id), eq(leads.orgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    const [deleted] = await db
      .delete(leads)
      .where(and(eq(leads.id, id), eq(leads.orgId, orgId)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
