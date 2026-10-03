import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/tenant";
import { getRazorpayPlanId } from "@/lib/razorpay-plans";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

const allowedPlans = ["PRO", "TEAM"] as const;

export async function POST(request: Request) {
  try {
    const membership = await getCurrentMembership();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const requestedPlan = String(body.plan ?? "").toUpperCase();

    if (
      !allowedPlans.includes(
        requestedPlan as (typeof allowedPlans)[number]
      )
    ) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    const planId = getRazorpayPlanId(
      requestedPlan as (typeof allowedPlans)[number]
    );

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
    });
    await prisma.subscription.update({
  where: {
    organizationId: membership.organizationId,
  },
 data: {
  plan: requestedPlan as "PRO" | "TEAM",
  razorpaySubscriptionId: subscription.id,
},
});

    return NextResponse.json({
      success: true,
      plan: requestedPlan,
      organizationId: membership.organizationId,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Razorpay checkout error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout subscription" },
      { status: 500 }
    );
  }
}