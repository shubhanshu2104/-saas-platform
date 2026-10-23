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
const effectivePlan =
  subscription.status === "CANCELLED" ||
  subscription.status === "EXPIRED" ||
  subscription.status === "PAST_DUE"
    ? "FREE"
    : subscription.plan;

  return {
    ...subscription,
    effectivePlan,
    config: PLAN_CONFIG[effectivePlan],
  };
}