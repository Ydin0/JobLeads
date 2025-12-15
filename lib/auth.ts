import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
