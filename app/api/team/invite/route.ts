import { getCurrentSubscription } from "@/lib/subscription";
import { sendInvitationEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/tenant";
import { canManageTeam } from "@/lib/permissions";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function POST(request: Request) {
  try {
    // 1. Check authentication + current organization
    const membership = await getCurrentMembership();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Check whether user can manage the team
    if (!canManageTeam(membership.role)) {
      return NextResponse.json(
        { error: "You do not have permission to invite members." },
        { status: 403 }
      );
    }
    const subscription = await getCurrentSubscription();

if (!subscription) {
  return NextResponse.json(
    { error: "Subscription not found." },
    { status: 500 }
  );
}

const memberCount = await prisma.organizationMember.count({
  where: {
    organizationId: membership.organizationId,
  },
});

const pendingInvitationCount =
  await prisma.invitation.count({
    where: {
      organizationId: membership.organizationId,
      status: "PENDING",
      expiresAt: {
        gt: new Date(),
      },
    },
  });

const totalSeatsUsed =
  memberCount + pendingInvitationCount;

if (totalSeatsUsed >= subscription.config.maxMembers) {
  return NextResponse.json(
    {
      error: `Your ${subscription.config.name} plan allows a maximum of ${subscription.config.maxMembers} team members.`,
    },
    { status: 403 }
  );
}

    // 3. Validate request body
    const body = await request.json();

    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase().trim();
    const role = result.data.role;

    // 4. Check whether user is already a member
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      const existingMembership =
        await prisma.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: existingUser.id,
              organizationId: membership.organizationId,
            },
          },
        });

      if (existingMembership) {
        return NextResponse.json(
          {
            error: "This user is already a member of the organization.",
          },
          { status: 409 }
        );
      }
    }

    // 5. Check for an existing pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: membership.organizationId,
        status: "PENDING",
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        {
          error: "A pending invitation already exists for this email.",
        },
        { status: 409 }
      );
    }

    // 6. Generate a secure invitation token
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Never store the raw token in the database
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Invitation expires after 7 days
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // 7. Create invitation
   const invitation = await prisma.invitation.create({
  data: {
    email,
    role,
    organizationId: membership.organizationId,
    invitedById: membership.userId,
    tokenHash,
    expiresAt,
  },
});

const invitationUrl =
  `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/invite/${rawToken}`;

const inviter = await prisma.user.findUnique({
  where: {
    id: membership.userId,
  },
  select: {
    name: true,
    email: true,
  },
});

await sendInvitationEmail({
  to: email,
  organizationName: membership.organization.name,
  inviterName: inviter?.name ?? inviter?.email ?? "A team member",
  invitationUrl,
});
    // Temporary response.
    // Later Resend will send the actual invitation link.
    return NextResponse.json(
      {
        message: "Invitation created successfully.",
        invitationId: invitation.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("INVITE_ERROR", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the invitation.",
      },
      { status: 500 }
    );
  }
}