
import { NextResponse } from "next/server";
import { getCurrentMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export async function POST() {
  try {
    const membership = await getCurrentMembership();

    if (!membership) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (
      membership.role !== "OWNER" &&
      membership.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          error:
            "Only organization owners and admins can manage billing.",
        },
        { status: 403 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        organizationId: membership.organizationId,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found." },
        { status: 404 }
      );
    }

    if (subscription.cancelAtPeriodEnd) {
      return NextResponse.json({
        success: true,
        cancelAtPeriodEnd: true,
        currentPeriodEnd: subscription.currentPeriodEnd,
        message: "Cancellation is already scheduled.",
      });
    }

    if (
      subscription.plan === "FREE" ||
      subscription.status !== "ACTIVE" ||
      !subscription.razorpaySubscriptionId
    ) {
      return NextResponse.json(
        {
          error:
            "There is no active paid subscription available to cancel.",
        },
        { status: 409 }
      );
    }

    const remote = await razorpay.subscriptions.fetch(
      subscription.razorpaySubscriptionId
    );

    if (remote.status !== "active") {
      return NextResponse.json(
        {
          error:
            "The payment provider does not report this subscription as active. Refresh billing status before trying again.",
        },
        { status: 409 }
      );
    }

    // true requests cancellation at the end of the current billing cycle.
    await razorpay.subscriptions.cancel(
      subscription.razorpaySubscriptionId,
      true
    );

    const currentPeriodEnd =
      typeof remote.current_end === "number" &&
      remote.current_end > 0
        ? new Date(remote.current_end * 1000)
        : subscription.currentPeriodEnd;

    const updated = await prisma.subscription.update({
      where: {
        organizationId: membership.organizationId,
      },
      data: {
        cancelAtPeriodEnd: true,
        currentPeriodEnd,
      },
    });

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
      currentPeriodEnd: updated.currentPeriodEnd,
      message:
        "Cancellation has been requested for the end of the billing period.",
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);

    return NextResponse.json(
      {
        error:
          "Unable to schedule cancellation. Check the billing status and try again.",
      },
      { status: 500 }
    );
  }
}
