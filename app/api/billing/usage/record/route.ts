import { NextResponse } from "next/server";

import { recordOrganizationUsage } from "@/lib/usage";
import { getCurrentMembership } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    const membership = await getCurrentMembership();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const units =
      typeof body.units === "number"
        ? body.units
        : 1;

    const result = await recordOrganizationUsage(
      membership.organizationId,
      units
    );

    return NextResponse.json({
      success: true,
      usage: {
        used: result.used,
        limit: result.limit,
        remaining: result.remaining,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to record usage.";

    if (message.includes("Monthly usage limit")) {
      return NextResponse.json(
        { error: message },
        { status: 403 }
      );
    }

    console.error("USAGE_RECORD_API_ERROR", error);

    return NextResponse.json(
      { error: "Unable to record usage." },
      { status: 500 }
    );
  }
}