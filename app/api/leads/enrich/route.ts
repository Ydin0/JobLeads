import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, and, inArray } from "drizzle-orm";
import { bulkEnrichPeople } from "@/lib/apollo";
import { headers } from "next/headers";

// POST /api/leads/enrich - Bulk enrich leads using Apollo
export async function POST(req: Request) {
  try {
    const { orgId } = await requireOrgAuth();

    // Get the base URL for webhook
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const protocol = headersList.get("x-forwarded-proto") || "https";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const webhookUrl = `${baseUrl}/api/webhooks/apollo/phones`;
    // Apollo docs suggest URL encoding might be needed
    const encodedWebhookUrl = encodeURI(webhookUrl);

    console.log("[Bulk Enrich] Webhook URL config:", {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
      host,
      protocol,
      baseUrl,
      webhookUrl,
      encodedWebhookUrl,
    });

    const body = await req.json();
    const { leadIds, revealPhoneNumber = false } = body;

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { error: "leadIds array is required" },
        { status: 400 }
      );
    }

    console.log("[Bulk Enrich] Enriching", leadIds.length, "leads, reveal_phone:", revealPhoneNumber);

    // Get the leads with their Apollo IDs
    const leadsToEnrich = await db.query.leads.findMany({
      where: and(
        inArray(leads.id, leadIds),
        eq(leads.orgId, orgId)
      ),
    });

    if (leadsToEnrich.length === 0) {
      return NextResponse.json(
        { error: "No leads found" },
        { status: 404 }
      );
    }

    // Extract Apollo IDs from leads metadata
    const leadsWithApolloIds = leadsToEnrich.filter(lead => {
      const metadata = lead.metadata as Record<string, unknown> | null;
      return metadata?.apolloId;
    });

    const leadsWithoutApolloIds = leadsToEnrich.filter(lead => {
      const metadata = lead.metadata as Record<string, unknown> | null;
      return !metadata?.apolloId;
    });

    console.log("[Bulk Enrich]", leadsWithApolloIds.length, "leads have Apollo IDs,", leadsWithoutApolloIds.length, "do not");

    const results = {
      enriched: 0,
      skipped: leadsWithoutApolloIds.length,
      errors: 0,
      enrichedLeads: [] as string[],
      skippedLeads: leadsWithoutApolloIds.map(l => ({
        id: l.id,
        name: `${l.firstName} ${l.lastName}`,
        reason: "No Apollo ID available",
      })),
    };

    if (leadsWithApolloIds.length > 0) {
      // Create a map of Apollo ID to lead ID for updating
      const apolloIdToLeadMap = new Map<string, typeof leadsWithApolloIds[0]>();
      const apolloIds: string[] = [];

      for (const lead of leadsWithApolloIds) {
        const metadata = lead.metadata as Record<string, unknown>;
        const apolloId = metadata.apolloId as string;
        apolloIdToLeadMap.set(apolloId, lead);
        apolloIds.push(apolloId);
      }

      try {
        // Call bulk enrich API
        // If revealing phone numbers, Apollo sends them asynchronously to our webhook
        const enrichedPeople = await bulkEnrichPeople({
          apolloIds,
          revealPhoneNumber,
          webhookUrl: revealPhoneNumber ? encodedWebhookUrl : undefined,
        });

        if (revealPhoneNumber) {
          console.log("[Bulk Enrich] Phone numbers will be delivered to webhook:", webhookUrl);
        }

        console.log("[Bulk Enrich] Received", enrichedPeople.length, "enriched people from Apollo");

        // Update each lead with enriched data
        for (const person of enrichedPeople) {
          if (!person.apolloId) continue;

          const lead = apolloIdToLeadMap.get(person.apolloId);
          if (!lead) continue;

          try {
            await db
              .update(leads)
              .set({
                email: person.email || lead.email,
                phone: person.phone || lead.phone,
                firstName: person.firstName || lead.firstName,
                lastName: person.lastName || lead.lastName,
                jobTitle: person.jobTitle || lead.jobTitle,
                location: person.location || lead.location,
                linkedinUrl: person.linkedinUrl || lead.linkedinUrl,
                metadata: {
                  ...(lead.metadata as Record<string, unknown> || {}),
                  apolloId: person.apolloId,
                  enrichedAt: new Date().toISOString(),
                  enrichmentSource: "apollo_bulk",
                  seniority: person.seniority,
                  departments: person.departments,
                  phoneRevealed: revealPhoneNumber,
                  phonePending: revealPhoneNumber, // True while waiting for webhook
                  phoneRequestedAt: revealPhoneNumber ? new Date().toISOString() : null,
                },
                updatedAt: new Date(),
              })
              .where(eq(leads.id, lead.id));

            results.enriched++;
            results.enrichedLeads.push(lead.id);
          } catch (err) {
            console.error("[Bulk Enrich] Error updating lead:", lead.id, err);
            results.errors++;
          }
        }
      } catch (error) {
        console.error("[Bulk Enrich] Apollo bulk enrich error:", error);
        return NextResponse.json(
          {
            error: "Failed to enrich leads with Apollo",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    }

    console.log("[Bulk Enrich] Complete:", results);

    return NextResponse.json({
      success: true,
      ...results,
      phoneNumbersAsync: revealPhoneNumber,
      message: revealPhoneNumber
        ? "Enrichment complete. Phone numbers will be delivered in a few minutes."
        : "Enrichment complete.",
    });
  } catch (error) {
    console.error("Error bulk enriching leads:", error);
    return NextResponse.json(
      {
        error: "Failed to bulk enrich leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
