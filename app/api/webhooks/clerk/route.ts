import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, organizations, organizationMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  const eventType = evt.type;

  try {
    // Handle user events
    if (eventType === "user.created" || eventType === "user.updated") {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses?.[0]?.email_address;

      if (!primaryEmail) {
        return new Response("No email found", { status: 400 });
      }

      await db
        .insert(users)
        .values({
          id,
          email: primaryEmail,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: primaryEmail,
            firstName: first_name || null,
            lastName: last_name || null,
            imageUrl: image_url || null,
            updatedAt: new Date(),
          },
        });
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (id) {
        await db.delete(users).where(eq(users.id, id));
      }
    }

    // Handle organization events
    if (eventType === "organization.created" || eventType === "organization.updated") {
      const { id, name, slug, image_url, created_by } = evt.data;

      await db
        .insert(organizations)
        .values({
          id,
          name,
          slug: slug || null,
          imageUrl: image_url || null,
          createdBy: created_by || null,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name,
            slug: slug || null,
            imageUrl: image_url || null,
            updatedAt: new Date(),
          },
        });
    }

    if (eventType === "organization.deleted") {
      const { id } = evt.data;
      if (id) {
        await db.delete(organizations).where(eq(organizations.id, id));
      }
    }

    // Handle organization membership events
    if (eventType === "organizationMembership.created") {
      const { organization, public_user_data, role } = evt.data;

      // Ensure user exists first
      await db
        .insert(users)
        .values({
          id: public_user_data.user_id,
          email: public_user_data.identifier,
          firstName: public_user_data.first_name || null,
          lastName: public_user_data.last_name || null,
          imageUrl: public_user_data.image_url || null,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            firstName: public_user_data.first_name || null,
            lastName: public_user_data.last_name || null,
            imageUrl: public_user_data.image_url || null,
            updatedAt: new Date(),
          },
        });

      // Ensure organization exists
      await db
        .insert(organizations)
        .values({
          id: organization.id,
          name: organization.name,
          slug: organization.slug || null,
          imageUrl: organization.image_url || null,
          createdBy: organization.created_by || null,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: organization.name,
            slug: organization.slug || null,
            imageUrl: organization.image_url || null,
            updatedAt: new Date(),
          },
        });

      // Now create the membership with initialized credit fields
      const memberRole = role === "org:admin" ? "admin" : role === "org:member" ? "member" : "owner";

      await db
        .insert(organizationMembers)
        .values({
          orgId: organization.id,
          userId: public_user_data.user_id,
          role: memberRole,
          // Initialize credit tracking fields
          enrichmentLimit: null, // null = unlimited (use org limits)
          icpLimit: null, // null = unlimited
          enrichmentUsed: 0,
          icpUsed: 0,
          isBlocked: false,
        })
        .onConflictDoNothing();
    }

    if (eventType === "organizationMembership.deleted") {
      const { organization, public_user_data } = evt.data;

      await db
        .delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.orgId, organization.id),
            eq(organizationMembers.userId, public_user_data.user_id)
          )
        );
    }

    if (eventType === "organizationMembership.updated") {
      const { organization, public_user_data, role } = evt.data;
      const memberRole = role === "org:admin" ? "admin" : role === "org:member" ? "member" : "owner";

      await db
        .update(organizationMembers)
        .set({
          role: memberRole,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(organizationMembers.orgId, organization.id),
            eq(organizationMembers.userId, public_user_data.user_id)
          )
        );
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
