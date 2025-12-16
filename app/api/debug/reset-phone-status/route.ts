import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireOrgAuth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";

// Reset phone pending status for re-testing
async function resetPhoneStatus() {
  const { orgId } = await requireOrgAuth();

  // Reset all leads with phonePending: true back to normal state
  const result = await db
    .update(leads)
    .set({
      metadata: sql`
        CASE
          WHEN ${leads.metadata}->>'phonePending' = 'true'
          THEN jsonb_set(
            jsonb_set(
              COALESCE(${leads.metadata}, '{}'),
              '{phonePending}',
              'false'::jsonb
            ),
            '{phoneRevealed}',
            'false'::jsonb
          )
          ELSE ${leads.metadata}
        END
      `,
      updatedAt: new Date(),
    })
    .where(eq(leads.orgId, orgId))
    .returning({ id: leads.id });

  console.log("[Debug] Reset phone status for", result.length, "leads");

  return {
    success: true,
    message: `Reset ${result.length} leads. You can now re-enrich them with phone numbers.`,
    resetCount: result.length,
  };
}

// GET /api/debug/reset-phone-status - Reset via browser visit
export async function GET() {
  try {
    const result = await resetPhoneStatus();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting phone status:", error);
    return NextResponse.json(
      { error: "Failed to reset", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/debug/reset-phone-status - Reset via API call
export async function POST() {
  try {
    const result = await resetPhoneStatus();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error resetting phone status:", error);
    return NextResponse.json(
      { error: "Failed to reset", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
