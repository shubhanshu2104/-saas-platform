import crypto from "crypto";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        customer_id?: string;
        current_start?: number;
        current_end?: number;
        status?: string;
      };
    };
  };
};

function unixToDate(value?: number) {
  if (!value) {
    return undefined;
  }

  return new Date(value * 1000);
}

export async function POST(request: Request) {
  try {
    const body = await request.text();

    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is missing");

      return NextResponse.json(
        { error: "Webhook configuration missing" },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);

    const signaturesMatch =
      signatureBuffer.length === expectedSignatureBuffer.length &&
      crypto.timingSafeEqual(
        signatureBuffer,
        expectedSignatureBuffer
      );

    if (!signaturesMatch) {
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

    const eventName = event.event;

    console.log("Razorpay webhook received:", eventName);

    const subscription =
      event.payload?.subscription?.entity;

    const razorpaySubscriptionId = subscription?.id;

    if (!razorpaySubscriptionId) {
      return NextResponse.json({ received: true });
    }

   const existingSubscription =
  await prisma.subscription.findFirst({
    where: {
      razorpaySubscriptionId,
    },
  });

    if (!existingSubscription) {
      console.warn(
        "Nexora subscription not found:",
        razorpaySubscriptionId
      );

      return NextResponse.json({ received: true });
    }

    const currentPeriodStart =
      unixToDate(subscription.current_start);

    const currentPeriodEnd =
      unixToDate(subscription.current_end);

    switch (eventName) {
      case "subscription.activated":
      case "subscription.charged":
        await prisma.subscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            status: "ACTIVE",
            razorpayCustomerId:
              subscription.customer_id ??
              existingSubscription.razorpayCustomerId,
            currentPeriodStart,
            currentPeriodEnd,
          },
        });
        break;

      case "subscription.pending":
      case "subscription.halted":
        await prisma.subscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            status: "PAST_DUE",
            razorpayCustomerId:
              subscription.customer_id ??
              existingSubscription.razorpayCustomerId,
            currentPeriodStart,
            currentPeriodEnd,
          },
        });
        break;

      case "subscription.cancelled":
        await prisma.subscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            status: "CANCELLED",
            razorpayCustomerId:
              subscription.customer_id ??
              existingSubscription.razorpayCustomerId,
          },
        });
        break;

      case "subscription.completed":
      case "subscription.expired":
        await prisma.subscription.update({
          where: {
            id: existingSubscription.id,
          },
          data: {
            status: "EXPIRED",
            razorpayCustomerId:
              subscription.customer_id ??
              existingSubscription.razorpayCustomerId,
          },
        });
        break;

      default:
        console.log(
          "Unhandled Razorpay webhook event:",
          eventName
        );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Razorpay webhook processing error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}