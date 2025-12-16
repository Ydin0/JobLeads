import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// POST /api/webhooks/apollo/phones - Receive phone numbers from Apollo
// Apollo sends phone data asynchronously after bulk_match with reveal_phone_number=true
export async function POST(req: Request) {
  console.log("[Apollo Webhook] ========== WEBHOOK CALLED ==========");
  console.log("[Apollo Webhook] Headers:", Object.fromEntries(req.headers.entries()));

  try {
    const rawBody = await req.text();
    console.log("[Apollo Webhook] Raw body:", rawBody);

    const data = JSON.parse(rawBody);
    console.log("[Apollo Webhook] Parsed data:", JSON.stringify(data, null, 2));

    // Apollo sends phone data in various formats, handle the response
    // The response typically contains the person ID and phone numbers
    const people = data.matches || data.people || (Array.isArray(data) ? data : [data]);

    if (!people || people.length === 0) {
      console.log("[Apollo Webhook] No people data in webhook");
      return NextResponse.json({ success: true, message: "No data to process" });
    }

    let updated = 0;
    let errors = 0;

    for (const person of people) {
      if (!person) continue;

      const apolloId = person.id;
      if (!apolloId) {
        console.log("[Apollo Webhook] Person without ID:", person);
        continue;
      }

      // Extract phone numbers
      const phoneNumbers = person.phone_numbers || [];
      const primaryPhone = phoneNumbers.find((p: { status: string }) => p.status === "verified")?.sanitized_number
        || phoneNumbers[0]?.sanitized_number
        || phoneNumbers[0]?.raw_number
        || null;

      const hasPhone = !!primaryPhone;
      console.log("[Apollo Webhook] Updating lead with Apollo ID:", apolloId, "phone:", primaryPhone || "not found");

      try {
        // Find and update leads with this Apollo ID in their metadata
        // Using raw SQL to query JSONB field
        // Set phonePending to false and update phone number (if found)
        const now = new Date();
        const phoneUpdatedAt = JSON.stringify(now.toISOString());
        const result = await db
          .update(leads)
          .set({
            ...(hasPhone ? { phone: primaryPhone } : {}),
            metadata: hasPhone
              ? sql`jsonb_set(jsonb_set(jsonb_set(COALESCE(${leads.metadata}, '{}'), '{phoneUpdatedAt}', ${phoneUpdatedAt}::jsonb), '{phonePending}', 'false'::jsonb), '{phoneFound}', 'true'::jsonb)`
              : sql`jsonb_set(jsonb_set(jsonb_set(COALESCE(${leads.metadata}, '{}'), '{phoneUpdatedAt}', ${phoneUpdatedAt}::jsonb), '{phonePending}', 'false'::jsonb), '{phoneFound}', 'false'::jsonb)`,
            updatedAt: now,
          })
          .where(sql`${leads.metadata}->>'apolloId' = ${apolloId}`)
          .returning({ id: leads.id });

        if (result.length > 0) {
          updated += result.length;
          console.log("[Apollo Webhook] Updated", result.length, "lead(s) for Apollo ID:", apolloId);
        } else {
          console.log("[Apollo Webhook] No lead found with Apollo ID:", apolloId);
        }
      } catch (err) {
        console.error("[Apollo Webhook] Error updating lead:", err);
        errors++;
      }
    }

    console.log("[Apollo Webhook] Complete - Updated:", updated, "Errors:", errors);

    return NextResponse.json({
      success: true,
      updated,
      errors,
    });
  } catch (error) {
    console.error("[Apollo Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Also handle GET for webhook verification if Apollo requires it
export async function GET() {
  return NextResponse.json({ status: "ok", message: "Apollo phone webhook endpoint" });
}
