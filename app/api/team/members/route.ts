import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizationMembers, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthContextWithRole } from "@/lib/auth";

// GET /api/team/members - List all team members with their limits and usage
export async function GET() {
  try {
    const context = await getAuthContextWithRole();

    if (!context) {
      return NextResponse.json(
        { error: "Unauthorized - Organization required" },
        { status: 401 }
      );
    }

    // Fetch all members for this organization
    const members = await db
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
        // User info
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userImageUrl: users.imageUrl,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(organizationMembers.userId, users.id))
      .where(eq(organizationMembers.orgId, context.orgId));

    // Format the response
    const formattedMembers = members.map((member) => ({
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
      isCurrentUser: member.userId === context.userId,
      canManage: context.isAdmin && member.role !== "owner" && member.userId !== context.userId,
    }));

    return NextResponse.json({
      members: formattedMembers,
      currentUserIsAdmin: context.isAdmin,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}
