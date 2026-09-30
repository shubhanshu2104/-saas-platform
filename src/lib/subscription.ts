import { PLAN_CONFIG } from "./plans";
import { prisma } from "@/lib/prisma";
import { getCurrentMembership } from "@/lib/tenant";

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

  // Every organization should start on the FREE plan.
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        organizationId: membership.organizationId,
        plan: "FREE",
        status: "ACTIVE",
      },
    });
  }

  return {
    ...subscription,
    config: PLAN_CONFIG[subscription.plan],
  };
}