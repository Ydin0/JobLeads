import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { organizations, users, organizationMembers } from "@/lib/db/schema";

// GET /api/debug/sync-org - Sync current Clerk org to local database
// Use this for local development when webhooks don't work
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json({ error: "No organization selected" }, { status: 400 });
    }

    const clerk = await clerkClient();

    // Fetch org details from Clerk
    const org = await clerk.organizations.getOrganization({ organizationId: orgId });
    const user = await clerk.users.getUser(userId);

    // Sync user to database
    await db
      .insert(users)
      .values({
        id: userId,
        email: user.emailAddresses[0]?.emailAddress || "",
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          firstName: user.firstName,
          lastName: user.lastName,
          imageUrl: user.imageUrl,
          updatedAt: new Date(),
        },
      });

    // Sync organization to database
    await db
      .insert(organizations)
      .values({
        id: orgId,
        name: org.name,
        slug: org.slug,
        imageUrl: org.imageUrl,
        createdBy: org.createdBy,
      })
      .onConflictDoUpdate({
        target: organizations.id,
        set: {
          name: org.name,
          slug: org.slug,
          imageUrl: org.imageUrl,
          updatedAt: new Date(),
        },
      });

    // Sync membership
    await db
      .insert(organizationMembers)
      .values({
        orgId: orgId,
        userId: userId,
        role: "owner", // Assume owner for dev
        enrichmentLimit: null,
        icpLimit: null,
        enrichmentUsed: 0,
        icpUsed: 0,
        isBlocked: false,
      })
      .onConflictDoNothing();

    return NextResponse.json({
      success: true,
      message: "Organization synced to local database",
      data: {
        userId,
        orgId,
        orgName: org.name,
      },
    });
  } catch (error) {
    console.error("Error syncing org:", error);
    return NextResponse.json(
      { error: "Failed to sync organization", details: String(error) },
      { status: 500 }
    );
  }
}
