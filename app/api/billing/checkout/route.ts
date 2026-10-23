
import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/tenant";
import { getRazorpayPlanId } from "@/lib/razorpay-plans";
import { razorpay } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

const allowedPlans = ["PRO", "TEAM"] as const;
type PaidPlan = (typeof allowedPlans)[number];

const checkoutInProgressStatuses = [
  "created",
  "authenticated",
  "pending",
  "halted",
] as const;

export async function POST(request: Request) {
  try {
    const membership = await getCurrentMembership();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only organization owners and admins can manage billing." },
        { status: 403 }
      );
    }

    let body: { plan?: unknown };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const requestedPlan = String(body.plan ?? "").toUpperCase();

    if (!allowedPlans.includes(requestedPlan as PaidPlan)) {
      return NextResponse.json(
        { error: "Invalid plan. Choose PRO or TEAM." },
        { status: 400 }
      );
    }

    const plan = requestedPlan as PaidPlan;
    const planId = getRazorpayPlanId(plan);

    const existing = await prisma.subscription.findUnique({
      where: { organizationId: membership.organizationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Billing setup is incomplete. Please refresh and try again." },
        { status: 409 }
      );
    }

    if (existing.razorpaySubscriptionId) {
      const current = await razorpay.subscriptions.fetch(
        existing.razorpaySubscriptionId
      );

      if (current.status === "active") {
        return NextResponse.json(
          {
            error:
              "Your organization already has an active subscription. Manage it from Billing before starting another checkout.",
          },
          { status: 409 }
        );
      }

      if (
        checkoutInProgressStatuses.includes(
          current.status as (typeof checkoutInProgressStatuses)[number]
        )
      ) {
        if (current.plan_id === planId) {
          return NextResponse.json({
            success: true,
            plan,
            organizationId: membership.organizationId,
            subscriptionId: current.id,
          });
        }

        return NextResponse.json(
          {
            error:
              "Another subscription checkout is already in progress. Finish or resolve it before choosing a different plan.",
          },
          { status: 409 }
        );
      }
    }

    const created = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: 12,
    });

    try {
      await prisma.subscription.update({
        where: { organizationId: membership.organizationId },
        data: { razorpaySubscriptionId: created.id },
      });
    } catch (error) {
      // Best-effort cleanup if the local subscription cannot be linked.
      try {
        await razorpay.subscriptions.cancel(created.id, false);
      } catch (cleanupError) {
        console.error(
          "Unable to cancel unlinked Razorpay subscription:",
          cleanupError
        );
      }

      throw error;
    }

    return NextResponse.json({
      success: true,
      plan,
      organizationId: membership.organizationId,
      subscriptionId: created.id,
    });
  } catch (error) {
    console.error("Razorpay checkout error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout subscription. Please try again." },
      { status: 500 }
    );
  }
}
