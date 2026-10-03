import { prisma } from "@/lib/prisma";
import { getCurrentSubscription } from "@/lib/subscription";

function getCurrentBillingPeriod() {
  const now = new Date();

  const periodStart = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1,
      0,
      0,
      0,
      0
    )
  );

  const periodEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0
    )
  );

  return {
    periodStart,
    periodEnd,
  };
}

export async function getCurrentUsage() {
  const subscription = await getCurrentSubscription();

  if (!subscription) {
    return null;
  }

  const { periodStart, periodEnd } =
    getCurrentBillingPeriod();

  const result = await prisma.usageRecord.aggregate({
    where: {
      organizationId: subscription.organizationId,
      periodStart,
      periodEnd,
    },
    _sum: {
      units: true,
    },
  });

  const used = result._sum.units ?? 0;
  const limit = subscription.config.monthlyUsageLimit;
  const remaining = Math.max(limit - used, 0);

  return {
    used,
    limit,
    remaining,
    periodStart,
    periodEnd,
    percentage:
      limit === 0
        ? 100
        : Math.min(Math.round((used / limit) * 100), 100),
  };
}

export async function recordUsage(units = 1) {
  if (!Number.isInteger(units) || units <= 0) {
    throw new Error("Usage units must be a positive integer.");
  }

  const subscription = await getCurrentSubscription();

  if (!subscription) {
    throw new Error("Subscription not found.");
  }

  const { periodStart, periodEnd } =
    getCurrentBillingPeriod();

  const currentUsage = await prisma.usageRecord.aggregate({
    where: {
      organizationId: subscription.organizationId,
      periodStart,
      periodEnd,
    },
    _sum: {
      units: true,
    },
  });

  const used = currentUsage._sum.units ?? 0;
  const limit = subscription.config.monthlyUsageLimit;

  if (used + units > limit) {
    throw new Error(
      `Monthly usage limit of ${limit} units exceeded.`
    );
  }

  const usageRecord = await prisma.usageRecord.create({
    data: {
      organizationId: subscription.organizationId,
      units,
      periodStart,
      periodEnd,
    },
  });

  return {
    usageRecord,
    used: used + units,
    limit,
    remaining: limit - (used + units),
  };
}