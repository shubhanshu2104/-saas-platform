import { getCurrentSubscription } from "@/lib/subscription";
import { getCurrentMembership } from "@/lib/tenant";
import { getCurrentUsage } from "@/lib/usage";
import { redirect } from "next/navigation";

export default async function BillingPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const subscription = await getCurrentSubscription();

  if (!subscription) {
    redirect("/dashboard");
  }

  const usage = await getCurrentUsage();

  if (!usage) {
    redirect("/dashboard");
  }

  const { organization } = membership;
  const { config } = subscription;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151515]">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10 lg:px-12">

        {/* HEADER */}
        <header className="border-b border-black/10 pb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
            NEXORA / BILLING
          </p>

          <div className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                Billing
              </h1>

              <p className="mt-3 text-sm text-black/50">
                Manage the subscription for {organization.name}.
              </p>
            </div>

            <span className="text-xs font-semibold tracking-[0.15em] text-black/40">
              {subscription.status}
            </span>
          </div>
        </header>

        {/* CURRENT SUBSCRIPTION */}
        <section className="border-b border-black/10 py-10">
          <div className="grid gap-8 sm:grid-cols-2">

            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
                CURRENT PLAN
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {config.name}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-black/50">
                {config.description}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
                MONTHLY PRICE
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                ₹{config.price.toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-sm text-black/40">
                per month
              </p>
            </div>

          </div>
        </section>

        {/* USAGE */}
        <section className="border-b border-black/10 py-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
                MONTHLY USAGE
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
                {usage.used.toLocaleString("en-IN")}
                <span className="ml-2 text-base font-normal text-black/40">
                  / {usage.limit.toLocaleString("en-IN")} units
                </span>
              </h2>

              <p className="mt-2 text-sm text-black/50">
                {usage.remaining.toLocaleString("en-IN")} units remaining
                this billing period.
              </p>
            </div>

            <p className="text-sm font-semibold text-black/50">
              {usage.percentage}% used
            </p>
          </div>

          <div className="mt-6 h-2 w-full overflow-hidden bg-black/10">
            <div
              className="h-full bg-black transition-all"
              style={{
                width: `${usage.percentage}%`,
              }}
            />
          </div>

          <div className="mt-4 flex justify-between text-xs text-black/40">
            <span>
              {usage.periodStart.toLocaleDateString("en-IN")}
            </span>

            <span>
              {usage.periodEnd.toLocaleDateString("en-IN")}
            </span>
          </div>
        </section>

        {/* LIMITS */}
        <section className="border-b border-black/10 py-10">
          <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
            PLAN LIMITS
          </p>

          <div className="mt-6 grid border-t border-black/10 sm:grid-cols-2">

            <div className="border-b border-black/10 py-6 sm:border-b-0 sm:border-r sm:pr-8">
              <p className="text-sm text-black/40">
                Team members
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {config.maxMembers}
              </p>
            </div>

            <div className="py-6 sm:pl-8">
              <p className="text-sm text-black/40">
                Monthly usage
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {config.monthlyUsageLimit.toLocaleString("en-IN")}
              </p>
            </div>

          </div>
        </section>

        {/* ACTION */}
        <section className="flex flex-col justify-between gap-6 pt-8 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-black/40">
              NEED MORE CAPACITY?
            </p>

            <p className="mt-2 text-sm text-black/50">
              Explore the available Nexora plans.
            </p>
          </div>

          <a
            href="/pricing"
            className="border border-black bg-black px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-black/80"
          >
            VIEW PLANS →
          </a>
        </section>

      </div>
    </main>
  );
}