
import { PLAN_CONFIG } from "./plans";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/tenant";
import type { Plan, SubscriptionStatus } from "@/generated/prisma/client";

type SubscriptionAccessState = {
  plan: Plan;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
};

export function getEffectivePlan(
  subscription: SubscriptionAccessState,
  now: Date = new Date()
): Plan {
  const paidPeriodStillValid =
    subscription.plan !== "FREE" &&
    subscription.cancelAtPeriodEnd &&
    subscription.currentPeriodEnd !== null &&
    subscription.currentPeriodEnd.getTime() > now.getTime();

  if (subscription.status === "CANCELLED" && paidPeriodStillValid) {
    return subscription.plan;
  }

  if (
    subscription.status === "CANCELLED" ||
    subscription.status === "EXPIRED" ||
    subscription.status === "PAST_DUE"
  ) {
    return "FREE";
  }

  return subscription.plan;
}

export async function getCurrentSubscription() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return null;
  }

  let subscription = await prisma.subscription.findUnique({
    where: {
      organizationId: membership.organizationId,
    },
  });

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        organizationId: membership.organizationId,
        plan: "FREE",
        status: "ACTIVE",
      },
    });
  }

  const effectivePlan = getEffectivePlan(subscription);

  return {
    ...subscription,
    effectivePlan,
    config: PLAN_CONFIG[effectivePlan],
  };
}
