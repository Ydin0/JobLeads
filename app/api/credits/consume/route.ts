import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { creditUsage } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

// POST /api/credits/consume - Consume credits
export async function POST(request: Request) {
  try {
    const { orgId, userId } = await auth();

    if (!orgId || !userId) {
      return NextResponse.json(
        { error: "Unauthorized - Organization required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, amount } = body;

    if (!type || !["enrichment", "icp"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid credit type. Must be 'enrichment' or 'icp'" },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== "number" || amount < 1) {
      return NextResponse.json(
        { error: "Invalid amount. Must be a positive number" },
        { status: 400 }
      );
    }

    // Get current credit usage
    let credits = await db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    });

    // If no credit record exists, create one
    if (!credits) {
      const now = new Date();
      const cycleEnd = new Date(now);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);

      const [newCredits] = await db
        .insert(creditUsage)
        .values({
          orgId,
          enrichmentLimit: 200,
          icpLimit: 1000,
          enrichmentUsed: 0,
          icpUsed: 0,
          billingCycleStart: now,
          billingCycleEnd: cycleEnd,
          planId: "free",
        })
        .returning();

      credits = newCredits;
    }

    // Check if billing cycle has ended and reset if needed
    const now = new Date();
    if (credits.billingCycleEnd && new Date(credits.billingCycleEnd) < now) {
      const cycleEnd = new Date(now);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);

      const [updatedCredits] = await db
        .update(creditUsage)
        .set({
          enrichmentUsed: 0,
          icpUsed: 0,
          billingCycleStart: now,
          billingCycleEnd: cycleEnd,
          updatedAt: now,
        })
        .where(eq(creditUsage.orgId, orgId))
        .returning();

      credits = updatedCredits;
    }

    // Check if enough credits are available
    const currentUsed = type === "enrichment" ? credits.enrichmentUsed : credits.icpUsed;
    const limit = type === "enrichment" ? credits.enrichmentLimit : credits.icpLimit;
    const remaining = limit - currentUsed;

    if (remaining < amount) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: amount,
          remaining,
          type,
        },
        { status: 402 } // Payment Required
      );
    }

    // Consume credits using atomic update
    const updateField =
      type === "enrichment"
        ? { enrichmentUsed: sql`${creditUsage.enrichmentUsed} + ${amount}` }
        : { icpUsed: sql`${creditUsage.icpUsed} + ${amount}` };

    const [updated] = await db
      .update(creditUsage)
      .set({
        ...updateField,
        updatedAt: now,
      })
      .where(eq(creditUsage.orgId, orgId))
      .returning();

    const newRemaining =
      type === "enrichment"
        ? updated.enrichmentLimit - updated.enrichmentUsed
        : updated.icpLimit - updated.icpUsed;

    return NextResponse.json({
      success: true,
      type,
      consumed: amount,
      remaining: newRemaining,
      used: type === "enrichment" ? updated.enrichmentUsed : updated.icpUsed,
      limit: type === "enrichment" ? updated.enrichmentLimit : updated.icpLimit,
    });
  } catch (error) {
    console.error("Error consuming credits:", error);
    return NextResponse.json(
      { error: "Failed to consume credits" },
      { status: 500 }
    );
  }
}
