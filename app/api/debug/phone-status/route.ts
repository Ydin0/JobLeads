import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// GET /api/debug/phone-status - Check phone enrichment status for debugging
export async function GET() {
  try {
    const { orgId } = await requireOrgAuth();

    // Get all leads with phone-related metadata
    const allLeads = await db.query.leads.findMany({
      where: eq(leads.orgId, orgId),
    });

    const leadsWithPhoneData = allLeads
      .filter(lead => {
        const metadata = lead.metadata as Record<string, unknown> | null;
        return metadata?.phoneRevealed || metadata?.phonePending || metadata?.apolloId;
      })
      .map(lead => {
        const metadata = lead.metadata as Record<string, unknown> | null;
        return {
          id: lead.id,
          name: `${lead.firstName} ${lead.lastName}`,
          phone: lead.phone,
          apolloId: metadata?.apolloId,
          phoneRevealed: metadata?.phoneRevealed,
          phonePending: metadata?.phonePending,
          phoneFound: metadata?.phoneFound,
          phoneRequestedAt: metadata?.phoneRequestedAt,
          phoneUpdatedAt: metadata?.phoneUpdatedAt,
        };
      });

    const summary = {
      total: leadsWithPhoneData.length,
      pending: leadsWithPhoneData.filter(l => l.phonePending).length,
      found: leadsWithPhoneData.filter(l => l.phoneFound).length,
      notFound: leadsWithPhoneData.filter(l => l.phoneRevealed && l.phoneFound === false).length,
      withPhone: leadsWithPhoneData.filter(l => l.phone).length,
    };

    return NextResponse.json({
      summary,
      leads: leadsWithPhoneData,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET'}/api/webhooks/apollo/phones`,
    });
  } catch (error) {
    console.error("Error checking phone status:", error);
    return NextResponse.json(
      { error: "Failed to check status", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
