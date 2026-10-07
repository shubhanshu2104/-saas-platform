import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentSubscription } from "@/lib/subscription";
import { PLAN_CONFIG } from "@/lib/plans";

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
export async function recordOrganizationUsage(
  organizationId: string,
  units = 1
) {
  if (!Number.isInteger(units) || units <= 0) {
    throw new Error("Usage units must be a positive integer.");
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const subscription =
            await tx.subscription.findUnique({
              where: {
                organizationId,
              },
            });

          if (!subscription) {
            throw new Error("Subscription not found.");
          }

          const { periodStart, periodEnd } =
            getCurrentBillingPeriod();

          const currentUsage =
            await tx.usageRecord.aggregate({
              where: {
                organizationId,
                periodStart,
                periodEnd,
              },
              _sum: {
                units: true,
              },
            });

          const used = currentUsage._sum.units ?? 0;

         const effectivePlan =
  subscription.status === "CANCELLED" ||
  subscription.status === "EXPIRED"
    ? "FREE"
    : subscription.plan;

const limit =
  PLAN_CONFIG[effectivePlan]
    .monthlyUsageLimit;
          if (used + units > limit) {
            throw new Error(
              `Monthly usage limit of ${limit} units exceeded.`
            );
          }

          const usageRecord =
            await tx.usageRecord.create({
              data: {
                organizationId,
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
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      const errorCode =
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : null;

      if (errorCode === "P2034" && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Unable to record usage.");
}