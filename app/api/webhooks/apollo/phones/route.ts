import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, employees, globalEmployees } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

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

    let leadsUpdated = 0;
    let employeesUpdated = 0;
    let globalEmployeesUpdated = 0;
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
      console.log("[Apollo Webhook] Processing Apollo ID:", apolloId, "phone:", primaryPhone || "not found");

      const now = new Date();

      try {
        // 1. Update globalEmployees (by apolloId column)
        const globalResult = await db
          .update(globalEmployees)
          .set({
            ...(hasPhone ? { phone: primaryPhone } : {}),
            metadata: sql`jsonb_set(COALESCE(${globalEmployees.metadata}, '{}'), '{phoneUpdatedAt}', ${JSON.stringify(now.toISOString())}::jsonb)`,
            updatedAt: now,
          })
          .where(eq(globalEmployees.apolloId, apolloId))
          .returning();

        if (globalResult.length > 0) {
          globalEmployeesUpdated += globalResult.length;
          console.log("[Apollo Webhook] Updated", globalResult.length, "global employee(s)");
        }
      } catch (err) {
        console.error("[Apollo Webhook] Error updating global employee:", err);
        errors++;
      }

      try {
        // 2. Update employees (by apolloId column)
        const employeeResult = await db
          .update(employees)
          .set({
            ...(hasPhone ? { phone: primaryPhone } : {}),
            metadata: sql`jsonb_set(COALESCE(${employees.metadata}, '{}'), '{phoneUpdatedAt}', ${JSON.stringify(now.toISOString())}::jsonb)`,
            updatedAt: now,
          })
          .where(eq(employees.apolloId, apolloId))
          .returning();

        if (employeeResult.length > 0) {
          employeesUpdated += employeeResult.length;
          console.log("[Apollo Webhook] Updated", employeeResult.length, "employee(s)");
        }
      } catch (err) {
        console.error("[Apollo Webhook] Error updating employee:", err);
        errors++;
      }

      try {
        // 3. Update leads (apolloId in metadata JSONB)
        const phoneUpdatedAt = JSON.stringify(now.toISOString());
        const leadsResult = await db
          .update(leads)
          .set({
            ...(hasPhone ? { phone: primaryPhone } : {}),
            metadata: hasPhone
              ? sql`jsonb_set(jsonb_set(jsonb_set(COALESCE(${leads.metadata}, '{}'), '{phoneUpdatedAt}', ${phoneUpdatedAt}::jsonb), '{phonePending}', 'false'::jsonb), '{phoneFound}', 'true'::jsonb)`
              : sql`jsonb_set(jsonb_set(jsonb_set(COALESCE(${leads.metadata}, '{}'), '{phoneUpdatedAt}', ${phoneUpdatedAt}::jsonb), '{phonePending}', 'false'::jsonb), '{phoneFound}', 'false'::jsonb)`,
            updatedAt: now,
          })
          .where(sql`${leads.metadata}->>'apolloId' = ${apolloId}`)
          .returning();

        if (leadsResult.length > 0) {
          leadsUpdated += leadsResult.length;
          console.log("[Apollo Webhook] Updated", leadsResult.length, "lead(s)");
        }
      } catch (err) {
        console.error("[Apollo Webhook] Error updating lead:", err);
        errors++;
      }
    }

    console.log("[Apollo Webhook] Complete - GlobalEmployees:", globalEmployeesUpdated, "Employees:", employeesUpdated, "Leads:", leadsUpdated, "Errors:", errors);

    return NextResponse.json({
      success: true,
      globalEmployeesUpdated,
      employeesUpdated,
      leadsUpdated,
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
