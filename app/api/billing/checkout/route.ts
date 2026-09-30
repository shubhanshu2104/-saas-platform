import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/tenant";

const allowedPlans = ["PRO", "TEAM"] as const;

export async function POST(request: Request) {
  const membership = await getCurrentMembership();

  if (!membership) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const requestedPlan = String(body.plan ?? "").toUpperCase();

  if (!allowedPlans.includes(requestedPlan as (typeof allowedPlans)[number])) {
    return NextResponse.json(
      { error: "Invalid plan" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    plan: requestedPlan,
    organizationId: membership.organizationId,
  });
}