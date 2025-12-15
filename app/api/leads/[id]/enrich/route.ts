import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { enrichPerson } from "@/lib/apollo";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/leads/[id]/enrich - Enrich a lead using Apollo
export async function POST(_req: Request, { params }: RouteContext) {
  try {
    const { orgId } = await requireOrgAuth();
    const { id } = await params;

    // Get the lead
    const lead = await db.query.leads.findFirst({
      where: and(eq(leads.id, id), eq(leads.orgId, orgId)),
      with: {
        company: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    console.log("[Enrich Lead] Enriching lead:", lead.firstName, lead.lastName);

    // Enrich using Apollo - try LinkedIn URL first, then name + company
    const enrichedData = await enrichPerson({
      linkedinUrl: lead.linkedinUrl || undefined,
      firstName: lead.firstName,
      lastName: lead.lastName,
      organizationName: (lead as { company?: { name?: string } }).company?.name || undefined,
    });

    if (!enrichedData) {
      return NextResponse.json(
        { error: "Could not find enrichment data for this contact" },
        { status: 404 }
      );
    }

    // Update the lead with enriched data
    const [updatedLead] = await db
      .update(leads)
      .set({
        email: enrichedData.email || lead.email,
        phone: enrichedData.phone || lead.phone,
        jobTitle: enrichedData.jobTitle || lead.jobTitle,
        location: enrichedData.location || lead.location,
        linkedinUrl: enrichedData.linkedinUrl || lead.linkedinUrl,
        metadata: {
          ...(lead.metadata as Record<string, unknown> || {}),
          enrichedAt: new Date().toISOString(),
          enrichmentSource: "apollo",
          seniority: enrichedData.seniority,
          departments: enrichedData.departments,
        },
        updatedAt: new Date(),
      })
      .where(eq(leads.id, id))
      .returning();

    console.log("[Enrich Lead] Lead enriched successfully");

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      enrichedData,
    });
  } catch (error) {
    console.error("Error enriching lead:", error);
    return NextResponse.json(
      {
        error: "Failed to enrich lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
