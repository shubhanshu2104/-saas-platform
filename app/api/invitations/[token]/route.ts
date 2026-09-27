import { NextResponse } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required." },
        { status: 400 }
      );
    }

    // Hash the token supplied in the URL.
    // The database stores only this hash.
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const invitation = await prisma.invitation.findUnique({
      where: {
        tokenHash,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation." },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "This invitation is no longer active." },
        { status: 410 }
      );
    }

    if (invitation.expiresAt <= new Date()) {
      // Keep the database state accurate.
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

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        organization: invitation.organization,
        invitedBy: invitation.invitedBy,
      },
    });
  } catch (error) {
    console.error("INVITATION_VERIFY_ERROR", error);

    return NextResponse.json(
      { error: "Unable to verify invitation." },
      { status: 500 }
    );
  }
}