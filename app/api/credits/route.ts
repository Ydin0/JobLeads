import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { creditUsage, organizationMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdminAuth } from "@/lib/auth";

// Plan configurations
const PLANS = {
  free: {
    name: "Free",
    enrichmentLimit: 200,
    icpLimit: 1000,
    price: 0,
  },
  basic: {
    name: "Basic",
    enrichmentLimit: 200,
    icpLimit: 1000,
    price: 89,
  },
  advanced: {
    name: "Advanced",
    enrichmentLimit: 650,
    icpLimit: 10000,
    price: 249,
  },
  premier: {
    name: "Premier",
    enrichmentLimit: 1000,
    icpLimit: 100000,
    price: 599,
  },
  super: {
    name: "Super",
    enrichmentLimit: 2500,
    icpLimit: 200000,
    price: 1000,
  },
};

// GET /api/credits - Fetch current credit usage for org
export async function GET() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized - Organization required" },
        { status: 401 }
      );
    }

    // Get or create credit usage record
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
          enrichmentLimit: PLANS.free.enrichmentLimit,
          icpLimit: PLANS.free.icpLimit,
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

    const plan = PLANS[credits.planId as keyof typeof PLANS] || PLANS.free;

    return NextResponse.json({
      enrichment: {
        used: credits.enrichmentUsed,
        limit: credits.enrichmentLimit,
        remaining: credits.enrichmentLimit - credits.enrichmentUsed,
      },
      icp: {
        used: credits.icpUsed,
        limit: credits.icpLimit,
        remaining: credits.icpLimit - credits.icpUsed,
      },
      plan: {
        id: credits.planId,
        name: plan.name,
        price: plan.price,
      },
      billingCycle: {
        start: credits.billingCycleStart,
        end: credits.billingCycleEnd,
      },
    });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json(
      { error: "Failed to fetch credits" },
      { status: 500 }
    );
  }
}

// PATCH /api/credits - Update plan (admin only)
export async function PATCH(request: Request) {
  try {
    // Require admin access for plan changes
    let context;
    try {
      context = await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { orgId } = context;

    const body = await request.json();
    const { planId } = body;

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    const now = new Date();

    // Update or create credit usage with new plan limits
    const existing = await db.query.creditUsage.findFirst({
      where: eq(creditUsage.orgId, orgId),
    });

    if (existing) {
      await db
        .update(creditUsage)
        .set({
          planId,
          enrichmentLimit: plan.enrichmentLimit,
          icpLimit: plan.icpLimit,
          updatedAt: now,
        })
        .where(eq(creditUsage.orgId, orgId));
    } else {
      const cycleEnd = new Date(now);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);

      await db.insert(creditUsage).values({
        orgId,
        planId,
        enrichmentLimit: plan.enrichmentLimit,
        icpLimit: plan.icpLimit,
        enrichmentUsed: 0,
        icpUsed: 0,
        billingCycleStart: now,
        billingCycleEnd: cycleEnd,
      });
    }

    return NextResponse.json({
      success: true,
      plan: {
        id: planId,
        name: plan.name,
        enrichmentLimit: plan.enrichmentLimit,
        icpLimit: plan.icpLimit,
      },
    });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
