import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
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
  crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer);

  if (!signaturesMatch) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const event = JSON.parse(body);

  console.log("Razorpay webhook received:", event.event);

  return NextResponse.json({ received: true });
}