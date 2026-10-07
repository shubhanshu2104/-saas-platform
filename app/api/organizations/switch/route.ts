import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const organizationId =
      typeof body.organizationId === "string"
        ? body.organizationId
        : "";

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required." },
        { status: 400 }
      );
    }

    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId,
          },
        },
      });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization." },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        activeOrganizationId: organizationId,
      },
    });

    return NextResponse.json({
      success: true,
      organizationId,
    });
  } catch (error) {
    console.error("ORGANIZATION_SWITCH_ERROR", error);

    return NextResponse.json(
      { error: "Unable to switch organization." },
      { status: 500 }
    );
  }
}