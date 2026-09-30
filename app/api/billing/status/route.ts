import { NextResponse } from "next/server";
import { getCurrentSubscription } from "@/lib/subscription";

export async function GET() {
  const subscription = await getCurrentSubscription();

  if (!subscription) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
  });
}