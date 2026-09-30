import type { Plan } from "@/generated/prisma/client";

export type PlanConfig = {
  name: string;
  description: string;
  price: number;
  maxMembers: number;
  monthlyUsageLimit: number;
  features: string[];
};

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  FREE: {
    name: "Free",
    description: "For individuals and small experiments.",
    price: 0,
    maxMembers: 3,
    monthlyUsageLimit: 100,
    features: [
      "Up to 3 team members",
      "100 usage units/month",
      "Basic team management",
    ],
  },

  PRO: {
    name: "Pro",
    description: "For growing teams that need more capacity.",
    price: 999,
    maxMembers: 10,
    monthlyUsageLimit: 1000,
    features: [
      "Up to 10 team members",
      "1,000 usage units/month",
      "Advanced team management",
      "Priority support",
    ],
  },

  TEAM: {
    name: "Team",
    description: "For larger teams and heavier workloads.",
    price: 2499,
    maxMembers: 50,
    monthlyUsageLimit: 5000,
    features: [
      "Up to 50 team members",
      "5,000 usage units/month",
      "Advanced team management",
      "Usage analytics",
      "Priority support",
    ],
  },
};