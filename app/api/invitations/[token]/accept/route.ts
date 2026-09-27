import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // 1. Require authentication
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "You must be logged in to accept this invitation." },
        { status: 401 }
      );
    }

    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required." },
        { status: 400 }
      );
    }

    // 2. Hash the raw token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 3. Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation." },
        { status: 404 }
      );
    }

    // 4. Check invitation status
    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation is no longer active." },
        { status: 410 }
      );
    }

    // 5. Check expiry
    if (invitation.expiresAt <= new Date()) {
      await prisma.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      return NextResponse.json(
        { error: "This invitation has expired." },
        { status: 410 }
      );
    }

    // 6. Make sure the logged-in user owns the invited email
    const sessionEmail = session.user.email.toLowerCase().trim();
    const invitationEmail = invitation.email.toLowerCase().trim();

    if (sessionEmail !== invitationEmail) {
      return NextResponse.json(
        {
          error:
            "This invitation was sent to a different email address.",
        },
        { status: 403 }
      );
    }

    // 7. Find the logged-in user
    const user = await prisma.user.findUnique({
      where: {
        email: sessionEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    // 8. Create membership + accept invitation atomically
    await prisma.$transaction(async (tx) => {
      const existingMembership =
        await tx.organizationMember.findUnique({
          where: {
            userId_organizationId: {
              userId: user.id,
              organizationId: invitation.organizationId,
            },
          },
        });

      if (existingMembership) {
        throw new Error("ALREADY_MEMBER");
      }

      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
        },
      });

      await tx.invitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      message: "Invitation accepted successfully.",
      organizationId: invitation.organizationId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ALREADY_MEMBER"
    ) {
      return NextResponse.json(
        {
          error: "You are already a member of this organization.",
        },
        { status: 409 }
      );
    }

    console.error("INVITATION_ACCEPT_ERROR", error);

    return NextResponse.json(
      { error: "Unable to accept invitation." },
      { status: 500 }
    );
  }
}