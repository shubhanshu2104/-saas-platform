import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/tenant";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();

  if (!membership) {
    redirect("/login");
  }

  const { organization, role } = membership;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151515]">
      <div className="mx-auto max-w-7xl p-6 sm:p-10 lg:p-12">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
              WORKSPACE
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {organization.name}
            </h1>
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

        {/* MAIN */}
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

          <div className="border-b border-black/10 py-8 sm:border-b-0 sm:px-8 sm:border-r">
            <p className="text-xs tracking-[0.15em] text-black/40">
              YOUR ROLE
            </p>

            <p className="mt-3 text-lg font-medium">
              {role}
            </p>
          </div>

          <div className="py-8 sm:pl-8">
            <p className="text-xs tracking-[0.15em] text-black/40">
              STATUS
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-black" />
              <span className="text-lg font-medium">
                Active
              </span>
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}