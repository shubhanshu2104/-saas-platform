import { NextResponse } from "next/server";

import { getCurrentUsage } from "@/lib/usage";

export async function GET() {
  try {
    const usage = await getCurrentUsage();

    if (!usage) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        percentage: usage.percentage,
        periodStart: usage.periodStart,
        periodEnd: usage.periodEnd,
      },
    });
  } catch (error) {
    console.error("USAGE_API_ERROR", error);

    return NextResponse.json(
      { error: "Unable to fetch usage." },
      { status: 500 }
    );
  }
}