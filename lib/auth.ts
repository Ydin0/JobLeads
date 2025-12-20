import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations, organizationMembers, type OrganizationMember } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Types
export type MemberRole = "owner" | "admin" | "member";

export interface AuthContextWithRole {
  userId: string;
  orgId: string;
  user: typeof users.$inferSelect | null;
  organization: typeof organizations.$inferSelect | null;
  membership: OrganizationMember;
  role: MemberRole;
  isAdmin: boolean; // owner or admin
}

export async function getAuthContext() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return { userId: null, orgId: null, user: null, organization: null };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  let organization = null;
  if (orgId) {
    organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, orgId),
    });
  }

  return { userId, orgId, user, organization };
}

export async function requireAuth() {
  const context = await getAuthContext();

  if (!context.userId) {
    throw new Error("Unauthorized");
  }

  return context;
}

export async function requireOrgAuth() {
  const context = await getAuthContext();

  if (!context.userId || !context.orgId) {
    throw new Error("Unauthorized - organization required");
  }

  return context as {
    userId: string;
    orgId: string;
    user: typeof context.user;
    organization: typeof context.organization;
  };
}

// Get auth context with membership role information
export async function getAuthContextWithRole(): Promise<AuthContextWithRole | null> {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) return null;

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.userId, userId)
    ),
  });

  if (!membership) return null;

  const [user, organization] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId) }),
    db.query.organizations.findFirst({ where: eq(organizations.id, orgId) }),
  ]);

  return {
    userId,
    orgId,
    user: user || null,
    organization: organization || null,
    membership,
    role: membership.role as MemberRole,
    isAdmin: membership.role === "owner" || membership.role === "admin",
  };
}

// Require admin (owner or admin) role - throws if not admin
export async function requireAdminAuth(): Promise<AuthContextWithRole> {
  const context = await getAuthContextWithRole();

  if (!context) {
    throw new Error("Unauthorized - organization required");
  }

  if (!context.isAdmin) {
    throw new Error("Forbidden - admin access required");
  }

  return context;
}

// Check if member can spend credits
export async function checkMemberCredits(
  userId: string,
  orgId: string,
  type: "enrichment" | "icp",
  amount: number
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.orgId, orgId),
      eq(organizationMembers.userId, userId)
    ),
  });

  if (!membership) {
    return { allowed: false, reason: "Member not found" };
  }

  // Check if member is blocked
  if (membership.isBlocked) {
    return { allowed: false, reason: "Your spending has been blocked by an admin" };
  }

  const limit = type === "enrichment" ? membership.enrichmentLimit : membership.icpLimit;
  const used = type === "enrichment" ? membership.enrichmentUsed : membership.icpUsed;

  // null limit = unlimited (use org limits only)
  if (limit === null) {
    return { allowed: true };
  }

  const remaining = limit - used;

  if (remaining < amount) {
    return {
      allowed: false,
      reason: `You've reached your personal ${type} credit limit`,
      remaining,
    };
  }

  return { allowed: true, remaining };
}
