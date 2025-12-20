import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { creditUsage, organizationMembers, creditHistory } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { checkMemberCredits } from "@/lib/auth";

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
    const { type, amount, description, transactionType, searchId, companyId, metadata } = body;

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

    // Check member-level limits first
    const memberCheck = await checkMemberCredits(userId, orgId, type, amount);

    if (!memberCheck.allowed) {
      return NextResponse.json(
        {
          error: memberCheck.reason,
          remaining: memberCheck.remaining,
          limitType: "member",
          type,
        },
        { status: 402 } // Payment Required
      );
    }

    // Get current org credit usage
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

      // Reset org credits
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

      // Also reset all member usage for this org
      await db
        .update(organizationMembers)
        .set({
          enrichmentUsed: 0,
          icpUsed: 0,
          updatedAt: now,
        })
        .where(eq(organizationMembers.orgId, orgId));
    }

    // Check if enough org credits are available
    const currentUsed = type === "enrichment" ? credits.enrichmentUsed : credits.icpUsed;
    const limit = type === "enrichment" ? credits.enrichmentLimit : credits.icpLimit;
    const remaining = limit - currentUsed;

    if (remaining < amount) {
      return NextResponse.json(
        {
          error: "Insufficient organization credits",
          required: amount,
          remaining,
          limitType: "organization",
          type,
        },
        { status: 402 } // Payment Required
      );
    }

    // Consume credits at both org and member level atomically
    const orgUpdateField =
      type === "enrichment"
        ? { enrichmentUsed: sql`${creditUsage.enrichmentUsed} + ${amount}` }
        : { icpUsed: sql`${creditUsage.icpUsed} + ${amount}` };

    const memberUpdateField =
      type === "enrichment"
        ? { enrichmentUsed: sql`${organizationMembers.enrichmentUsed} + ${amount}` }
        : { icpUsed: sql`${organizationMembers.icpUsed} + ${amount}` };

    // Update org credits
    const [updatedOrgCredits] = await db
      .update(creditUsage)
      .set({
        ...orgUpdateField,
        updatedAt: now,
      })
      .where(eq(creditUsage.orgId, orgId))
      .returning();

    // Update member credits
    await db
      .update(organizationMembers)
      .set({
        ...memberUpdateField,
        updatedAt: now,
      })
      .where(
        and(
          eq(organizationMembers.orgId, orgId),
          eq(organizationMembers.userId, userId)
        )
      );

    const newRemaining =
      type === "enrichment"
        ? updatedOrgCredits.enrichmentLimit - updatedOrgCredits.enrichmentUsed
        : updatedOrgCredits.icpLimit - updatedOrgCredits.icpUsed;

    // Record credit history
    await db.insert(creditHistory).values({
      orgId,
      userId,
      creditType: type,
      transactionType: transactionType || (type === "enrichment" ? "employee_fetch" : "manual"),
      creditsUsed: amount,
      balanceAfter: newRemaining,
      description: description || `${type === "enrichment" ? "Enrichment" : "ICP"} credit usage`,
      searchId: searchId || null,
      companyId: companyId || null,
      metadata: metadata || null,
    });

    return NextResponse.json({
      success: true,
      type,
      consumed: amount,
      remaining: newRemaining,
      used: type === "enrichment" ? updatedOrgCredits.enrichmentUsed : updatedOrgCredits.icpUsed,
      limit: type === "enrichment" ? updatedOrgCredits.enrichmentLimit : updatedOrgCredits.icpLimit,
    });
  } catch (error) {
    console.error("Error consuming credits:", error);
    return NextResponse.json(
      { error: "Failed to consume credits" },
      { status: 500 }
    );
  }
}
