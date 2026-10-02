import type { Plan } from "@/generated/prisma/client";

const razorpayPlanIds: Partial<Record<Plan, string | undefined>> = {
  PRO: process.env.RAZORPAY_PRO_PLAN_ID,
  TEAM: process.env.RAZORPAY_TEAM_PLAN_ID,
};

export function getRazorpayPlanId(plan: Plan) {
  const planId = razorpayPlanIds[plan];

  if (!planId) {
    throw new Error(`Razorpay plan ID is missing for ${plan}`);
  }

  return planId;
}