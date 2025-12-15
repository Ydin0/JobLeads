import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { searches } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, desc } from "drizzle-orm";

// GET /api/searches - List all searches for the organization
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    const results = await db.query.searches.findMany({
      where: eq(searches.orgId, orgId),
      orderBy: [desc(searches.createdAt)],
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching searches:", error);
    return NextResponse.json(
      { error: "Failed to fetch searches" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

// POST /api/searches - Create a new search
export async function POST(req: Request) {
  try {
    const { userId, orgId } = await requireOrgAuth();
    const body = await req.json();

    const { name, description, filters } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const [newSearch] = await db
      .insert(searches)
      .values({
        orgId,
        userId,
        name,
        description,
        filters,
      })
      .returning();

    return NextResponse.json(newSearch, { status: 201 });
  } catch (error) {
    console.error("Error creating search:", error);
    return NextResponse.json(
      { error: "Failed to create search" },
      { status: error instanceof Error && error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
