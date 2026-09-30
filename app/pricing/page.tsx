"use client";

import { useState } from "react";
import { PLAN_CONFIG } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";
import BillingLink from "@/components/BillingLink";
const plans: Plan[] = ["FREE", "PRO", "TEAM"];

export default function PricingPage() {
    const [message, setMessage] = useState("");
  const [loadingPlan, setLoadingPlan] = useState<"PRO" | "TEAM" | null>(null);
    async function handleUpgrade(plan: "PRO" | "TEAM") {
    setLoadingPlan(plan);
    setMessage("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error ?? "Unable to start checkout.");
        return;
      }

      setMessage(`Checkout ready for ${data.plan} plan.`);
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  }  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151515]">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10 lg:px-12">

        {/* HEADER */}
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
            NEXORA / PLANS
          </p>

          <div className="mt-8 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">
                Plans built for
                <br />
                growing workspaces.
              </h1>
            </div>

            <p className="max-w-sm text-sm leading-6 text-black/50">
              Choose the workspace capacity that fits your team.
              Upgrade as your organization grows.
            </p>
          </div>
        </header>

        {/* PLANS */}
                {message && (
          <div className="border-b border-black/10 py-4 text-sm">
            {message}
          </div>
        )}
        <section className="grid border-b border-black/10 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const config = PLAN_CONFIG[plan];
            const isPro = plan === "PRO";

            return (
              <article
                key={plan}
                className={`relative flex min-h-[520px] flex-col border-black/10 p-7 sm:p-8 ${
                  index !== 2 ? "border-b lg:border-b-0 lg:border-r" : ""
                }`}
              >
                {isPro && (
                  <span className="absolute right-7 top-7 text-[10px] font-bold tracking-[0.18em] text-black/40">
                    RECOMMENDED
                  </span>
                )}

                {/* PLAN HEADER */}
                <div>
                  <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
                    0{index + 1} / {plan}
                  </p>

                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
                    {config.name}
                  </h2>

                  <p className="mt-3 max-w-xs text-sm leading-6 text-black/50">
                    {config.description}
                  </p>
                </div>

                {/* PRICE */}
                <div className="mt-10 border-y border-black/10 py-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-[-0.05em]">
                      ₹{config.price.toLocaleString("en-IN")}
                    </span>

                    <span className="text-sm text-black/40">
                      / month
                    </span>
                  </div>
                </div>

                {/* CAPACITY */}
                <div className="mt-7">
                  <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
                    CAPACITY
                  </p>

                  <p className="mt-2 text-sm">
                    {config.maxMembers} team members
                  </p>

                  <p className="mt-1 text-sm text-black/50">
                    {config.monthlyUsageLimit.toLocaleString("en-IN")} usage
                    units / month
                  </p>
                </div>

                {/* FEATURES */}
                <div className="mt-7 flex-1">
                  <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
                    INCLUDED
                  </p>

                  <ul className="mt-4 space-y-3">
                    {config.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-3 text-sm leading-5"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ACTION */}
                {plan === "FREE" ? (
                  <button
                    type="button"
                    disabled
                    className="mt-8 w-full cursor-default border border-black/10 bg-black/5 px-5 py-3 text-sm font-semibold text-black/40"
                  >
                    Current plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan)}
                    className={`mt-8 w-full border px-5 py-3 text-sm font-semibold transition ${
                      isPro
                        ? "border-black bg-black text-white hover:bg-black/80"
                        : "border-black/15 bg-white hover:border-black/40"
                    }`}
                  >
                    {loadingPlan === plan ? "Preparing..." : `Choose ${config.name}`}
                  </button>
                )}
              </article>
            );
          })}
        </section>

        {/* FOOTER NOTE */}
        <footer className="flex flex-col gap-4 border-t border-black/10 pt-6 text-xs text-black/40 sm:flex-row sm:items-center sm:justify-between">
  <span>NEXORA / SUBSCRIPTION</span>

  <div className="flex items-center gap-6">
    <span>
      Plans and limits are applied at the workspace level.
    </span>

   <a
  href="/billing"
  className="font-semibold tracking-[0.15em] text-black underline underline-offset-4 hover:opacity-60"
>
  BILLING →
</a>
  </div>
</footer>
      </div>
    </main>
  );
}