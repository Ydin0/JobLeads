import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdminAuth } from "@/lib/auth";

// GET /api/team/invitations - List pending invitations
export async function GET() {
  try {
    let context;
    try {
      context = await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const client = await clerkClient();
    const invitations = await client.organizations.getOrganizationInvitationList({
      organizationId: context.orgId,
    });

    const formattedInvitations = invitations.data.map((inv) => ({
      id: inv.id,
      emailAddress: inv.emailAddress,
      role: inv.role,
      status: inv.status,
      createdAt: inv.createdAt,
    }));

    return NextResponse.json({ invitations: formattedInvitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}

// POST /api/team/invitations - Create a new invitation
export async function POST(request: Request) {
  try {
    let context;
    try {
      context = await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { emailAddress, role } = body;

    if (!emailAddress || typeof emailAddress !== "string") {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // Validate role (admin or member only, not owner)
    const validRoles = ["org:admin", "org:member"];
    const clerkRole = role === "admin" ? "org:admin" : "org:member";

    if (role && !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { error: "Role must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId: context.orgId,
      emailAddress,
      role: clerkRole,
      inviterUserId: context.userId,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating invitation:", error);

    // Handle Clerk-specific errors
    const clerkError = error as { errors?: Array<{ message: string; code: string }> };
    if (clerkError.errors && clerkError.errors.length > 0) {
      const firstError = clerkError.errors[0];
      if (firstError.code === "duplicate_record") {
        return NextResponse.json(
          { error: "An invitation has already been sent to this email" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

// DELETE /api/team/invitations - Revoke an invitation
export async function DELETE(request: Request) {
  try {
    let context;
    try {
      context = await requireAdminAuth();
    } catch {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json(
        { error: "Invitation ID is required" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    await client.organizations.revokeOrganizationInvitation({
      organizationId: context.orgId,
      invitationId,
      requestingUserId: context.userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking invitation:", error);
    return NextResponse.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
