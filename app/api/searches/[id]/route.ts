import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/searches/[id] - Get a single search
// Returns only the search metadata by default.
// Companies/jobs are fetched separately via /api/companies with proper pagination.
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Only fetch the search record, not related data
    // This prevents loading potentially thousands of companies/jobs
    const search = await db.query.searches.findFirst({
      where: and(eq(searches.id, id), eq(searches.orgId, orgId)),
    });

    if (!search) {
      return NextResponse.json(
        { error: "Search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(search);
  } catch (error) {
    console.error("Error fetching search:", error);
    return NextResponse.json(
      { error: "Failed to fetch search" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// PATCH /api/searches/[id] - Update a search
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;
    const body = await req.json();

    const { name, description, filters, status } = body;

    const [updated] = await db
      .update(searches)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(filters && { filters }),
        ...(status && { status }),
        updatedAt: new Date(),
      })
      .where(and(eq(searches.id, id), eq(searches.orgId, orgId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating search:", error);
    return NextResponse.json(
      { error: "Failed to update search" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// DELETE /api/searches/[id] - Delete a search
export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    const [deleted] = await db
      .delete(searches)
      .where(and(eq(searches.id, id), eq(searches.orgId, orgId)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting search:", error);
    return NextResponse.json(
      { error: "Failed to delete search" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
