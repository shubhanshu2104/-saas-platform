
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay-webhook-signature";
import type { Subscriptions } from "razorpay/dist/types/subscriptions";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { getPlanFromRazorpayPlanId } from "@/lib/razorpay-plans";

type RazorpayWebhook = {
  id?: string;
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
      };
    };
  };
};

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.authenticated",
  "subscription.activated",
  "subscription.charged",
  "subscription.pending",
  "subscription.halted",
  "subscription.cancelled",
  "subscription.completed",
  "subscription.expired",
]);

function unixToDate(
  value?: number | null
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === 0) return null;
  return new Date(value * 1000);
}

function getErrorCode(error: unknown): unknown {
  if (typeof error === "object" && error !== null && "code" in error) {
    return error.code;
  }

  return undefined;
}

export async function POST(request: Request) {
  let receivedEventId: string | undefined;

  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is missing");

      return NextResponse.json(
        { error: "Webhook configuration missing" },
        { status: 500 }
      );
    }

    if (
      !verifyRazorpayWebhookSignature(
        body,
        signature,
        webhookSecret
      )
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    let event: RazorpayWebhook;

    try {
      event = JSON.parse(body) as RazorpayWebhook;
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 }
      );
    }

    const eventId = event.id;
    const eventName = event.event;
    receivedEventId = eventId;

    if (!eventId || !eventName) {
      return NextResponse.json(
        { error: "Invalid webhook event" },
        { status: 400 }
      );
    }

    // Avoid unnecessary provider calls for already processed events.
    const alreadyProcessed =
      await prisma.razorpayWebhookEvent.findUnique({
        where: { eventId },
        select: { id: true },
      });

    if (alreadyProcessed) {
      return NextResponse.json({ received: true });
    }

    const razorpaySubscriptionId =
      event.payload?.subscription?.entity?.id;

    let latest: Subscriptions.RazorpaySubscription | null = null;

    if (
      SUBSCRIPTION_EVENTS.has(eventName) &&
      razorpaySubscriptionId
    ) {
      // Read the provider's current state rather than trusting
      // potentially stale state embedded in the event.
      latest = await razorpay.subscriptions.fetch(
        razorpaySubscriptionId
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.razorpayWebhookEvent.create({
        data: {
          eventId,
          eventType: eventName,
        },
      });

      // Unrelated events do not need a subscription update.
      if (
        !SUBSCRIPTION_EVENTS.has(eventName) ||
        !razorpaySubscriptionId
      ) {
        return;
      }

      const existing = await tx.subscription.findFirst({
        where: { razorpaySubscriptionId },
      });

      if (!existing) {
        throw new Error("NEXORA_SUBSCRIPTION_NOT_FOUND");
      }

      if (!latest) {
        throw new Error("NEXORA_SUBSCRIPTION_STATE_MISSING");
      }

      const customerId =
        latest.customer_id ?? existing.razorpayCustomerId;

      const currentPeriodStart = unixToDate(latest.current_start);
      const currentPeriodEnd = unixToDate(latest.current_end);

      const commonData = {
        razorpayCustomerId: customerId,
        currentPeriodStart,
        currentPeriodEnd,
      };

      switch (latest.status) {
        case "active": {
          const resolvedPlan = getPlanFromRazorpayPlanId(
            latest.plan_id
          );

          if (!resolvedPlan || resolvedPlan === "FREE") {
            throw new Error("UNMAPPED_RAZORPAY_PLAN");
          }

          await tx.subscription.update({
            where: { id: existing.id },
            data: {
              ...commonData,
              plan: resolvedPlan,
              status: "ACTIVE",
              // Do not clear cancelAtPeriodEnd here.
            },
          });

          break;
        }

        case "pending":
        case "halted":
        case "created":
        case "authenticated": {
          await tx.subscription.update({
            where: { id: existing.id },
            data: {
              ...commonData,
              status: "PAST_DUE",
            },
          });

          break;
        }

        case "cancelled": {
          await tx.subscription.update({
            where: { id: existing.id },
            data: {
              ...commonData,
              status: "CANCELLED",
              // Preserve cancelAtPeriodEnd and currentPeriodEnd.
              // Access is determined by getEffectivePlan().
            },
          });

          break;
        }

        case "completed":
        case "expired": {
          await tx.subscription.update({
            where: { id: existing.id },
            data: {
              ...commonData,
              status: "EXPIRED",
              cancelAtPeriodEnd: false,
            },
          });

          break;
        }

        default:
          throw new Error(
            "UNSUPPORTED_RAZORPAY_SUBSCRIPTION_STATUS"
          );
      }
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    const errorCode = getErrorCode(error);

    // A P2002 is treated as a duplicate only if this event
    // actually exists in the database.
    if (errorCode === "P2002" && receivedEventId) {
      const duplicate =
        await prisma.razorpayWebhookEvent.findUnique({
          where: { eventId: receivedEventId },
          select: { id: true },
        });

      if (duplicate) {
        return NextResponse.json({ received: true });
      }
    }

    if (
      error instanceof Error &&
      error.message === "NEXORA_SUBSCRIPTION_NOT_FOUND"
    ) {
      return NextResponse.json(
        { error: "Subscription not found; retry later" },
        { status: 500 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "UNMAPPED_RAZORPAY_PLAN"
    ) {
      console.error(
        "Unknown Razorpay plan; paid access was not granted."
      );

      return NextResponse.json(
        {
          error:
            "Unknown Razorpay plan; check plan configuration",
        },
        { status: 500 }
      );
    }

    console.error(
      "Razorpay webhook processing failed:",
      error
    );

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
