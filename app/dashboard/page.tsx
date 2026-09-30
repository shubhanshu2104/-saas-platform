import BillingLink from "@/components/BillingLink";
import { getCurrentSubscription } from "@/lib/subscription";
import { getCurrentMembership } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const membership = await getCurrentMembership();
const { upgrade } = await searchParams;
const requestedPlan =
  upgrade === "pro" || upgrade === "team" ? upgrade : null;
  if (!membership) {
    redirect("/login");
  }

  const subscription = await getCurrentSubscription();

  const { organization, role } = membership;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151515]">
      <div className="mx-auto max-w-7xl p-6 sm:p-10 lg:p-12">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-black/10 pb-6">
          <div className="flex items-center gap-6">
  <div className="text-right">
    <p className="text-xs tracking-[0.15em] text-black/40">
      ROLE
    </p>

    <p className="mt-1 text-sm font-semibold">
      {role}
    </p>
  </div>

 <BillingLink
  label="BILLING"
  className="border border-black/15 bg-white px-4 py-2 text-xs hover:border-black/40"
/>
</div>

          <div className="text-right">
            <p className="text-xs tracking-[0.15em] text-black/40">
              ROLE
            </p>

            <p className="mt-1 text-sm font-semibold">
              {role}
            </p>
          </div>
        </header>

        {/* MAIN INTRO */}
        <section className="py-16">
          <p className="text-xs font-semibold tracking-[0.25em] text-black/40">
            OVERVIEW / 01
          </p>

          <h2 className="mt-4 max-w-3xl text-5xl font-semibold leading-[0.95] tracking-[-0.06em] sm:text-6xl">
            Your workspace,
            <br />
            under control.
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-black/50">
            Manage your organization, team members, permissions,
            usage and billing from one workspace.
          </p>
        </section>

        {/* STATS */}
        <section className="grid border-t border-black/10 sm:grid-cols-3">

          <div className="border-b border-black/10 py-8 sm:border-b-0 sm:border-r sm:pr-8">
            <p className="text-xs tracking-[0.15em] text-black/40">
              ORGANIZATION
            </p>

            <p className="mt-3 text-lg font-medium">
              {organization.name}
            </p>
          </div>

          <div className="border-b border-black/10 py-8 sm:border-b-0 sm:border-r sm:px-8">
            <p className="text-xs tracking-[0.15em] text-black/40">
              YOUR ROLE
            </p>

            <p className="mt-3 text-lg font-medium">
              {role}
            </p>
          </div>

         <div className="py-8 sm:pl-8">
  <p className="text-xs tracking-[0.15em] text-black/40">
    BILLING STATUS
  </p>

  <div className="mt-3 flex items-center gap-2">
    <span className="h-2 w-2 rounded-full bg-black" />

    <span className="text-lg font-medium">
      {subscription?.status ?? "ACTIVE"}
    </span>
  </div>
</div>

        </section>

        {/* CURRENT PLAN */}
       {/* CURRENT PLAN */}
<section className="dashboard-plan">
  <div>
    <span className="dashboard-label">
      CURRENT PLAN
    </span>

    <h2>
      {subscription?.config.name ?? "Free"}
    </h2>

    <p>
      {subscription?.config.description ??
        "For individuals and small experiments."}
    </p>
  </div>

  <div className="dashboard-plan-meta">
    <strong>
      ₹
      {subscription?.config.price.toLocaleString("en-IN") ??
        "0"}
    </strong>

    <span>/ month</span>

    <a
      href="/pricing"
      className="mt-3 inline-block text-xs font-semibold tracking-[0.15em] underline underline-offset-4 hover:opacity-60"
    >
      VIEW PLANS →
    </a>
  </div>
</section>

<div className="mt-4 flex justify-end">
 <BillingLink
  label="MANAGE BILLING →"
  className="text-xs tracking-[0.15em] underline underline-offset-4"
/>
</div>
        {requestedPlan && (
          <section className="mt-6 border border-black/10 bg-white p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
              UPGRADE REQUEST
            </p>

            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              {requestedPlan === "pro" ? "Pro" : "Team"} plan selected.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-black/50">
              Your upgrade request has been received. Payment and subscription
              activation will be connected here.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}