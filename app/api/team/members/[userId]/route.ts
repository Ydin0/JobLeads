import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizationMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthContextWithRole, requireAdminAuth } from "@/lib/auth";

// GET /api/team/members/[userId] - Get specific member details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const context = await getAuthContextWithRole();

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized - Organization required" },
        { status: 401 }
      );
    }

    // Fetch the member
    const [member] = await db
      .select({
        id: organizationMembers.id,
        orgId: organizationMembers.orgId,
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        enrichmentLimit: organizationMembers.enrichmentLimit,
        icpLimit: organizationMembers.icpLimit,
        enrichmentUsed: organizationMembers.enrichmentUsed,
        icpUsed: organizationMembers.icpUsed,
        isBlocked: organizationMembers.isBlocked,
        updatedAt: organizationMembers.updatedAt,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userImageUrl: users.imageUrl,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(
        and(
          eq(organizationMembers.orgId, context.orgId),
          eq(organizationMembers.userId, userId)
        )
      );

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
      user: {
        email: member.userEmail,
        firstName: member.userFirstName,
        lastName: member.userLastName,
        imageUrl: member.userImageUrl,
      },
      credits: {
        enrichment: {
          limit: member.enrichmentLimit,
          used: member.enrichmentUsed,
          remaining: member.enrichmentLimit !== null
            ? member.enrichmentLimit - member.enrichmentUsed
            : null,
        },
        icp: {
          limit: member.icpLimit,
          used: member.icpUsed,
          remaining: member.icpLimit !== null
            ? member.icpLimit - member.icpUsed
            : null,
        },
      },
      isBlocked: member.isBlocked,
      canManage: context.isAdmin && member.role !== "owner" && member.userId !== context.userId,
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// PATCH /api/team/members/[userId] - Update member limits/blocked status (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Require admin access
    let context;
    try {
      context = await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Can't modify yourself
    if (userId === context.userId) {
      return NextResponse.json(
        { error: "Cannot modify your own limits" },
        { status: 400 }
      );
    }

    // Check if target member exists and get their role
    const [targetMember] = await db
      .select()
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.orgId, context.orgId),
          eq(organizationMembers.userId, userId)
        )
      );

    if (!targetMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Can't modify owner
    if (targetMember.role === "owner") {
      return NextResponse.json(
        { error: "Cannot modify owner's limits" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enrichmentLimit, icpLimit, isBlocked } = body;

    // Validate limits (null is allowed for unlimited)
    if (enrichmentLimit !== undefined && enrichmentLimit !== null) {
      if (typeof enrichmentLimit !== "number" || enrichmentLimit < 0) {
        return NextResponse.json(
          { error: "enrichmentLimit must be a non-negative number or null" },
          { status: 400 }
        );
      }
    }

    if (icpLimit !== undefined && icpLimit !== null) {
      if (typeof icpLimit !== "number" || icpLimit < 0) {
        return NextResponse.json(
          { error: "icpLimit must be a non-negative number or null" },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (enrichmentLimit !== undefined) {
      updateData.enrichmentLimit = enrichmentLimit;
    }

    if (icpLimit !== undefined) {
      updateData.icpLimit = icpLimit;
    }

    if (typeof isBlocked === "boolean") {
      updateData.isBlocked = isBlocked;
    }

    // Update the member
    const [updated] = await db
      .update(organizationMembers)
      .set(updateData)
      .where(
        and(
          eq(organizationMembers.orgId, context.orgId),
          eq(organizationMembers.userId, userId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      member: {
        userId: updated.userId,
        enrichmentLimit: updated.enrichmentLimit,
        icpLimit: updated.icpLimit,
        isBlocked: updated.isBlocked,
      },
    });
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
