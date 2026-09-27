import { redirect } from "next/navigation";

import { getCurrentOrganizationMembers } from "@/lib/team";

export default async function TeamPage() {
  const data = await getCurrentOrganizationMembers();

  if (!data) {
    redirect("/login");
  }

  const { organization, currentRole, members } = data;

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151515]">
      <div className="mx-auto max-w-7xl p-6 sm:p-10 lg:p-12">

        {/* HEADER */}
        <header className="flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
              WORKSPACE / TEAM
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              {organization.name}
            </h1>

            <p className="mt-3 text-sm text-black/50">
              Manage the people who have access to this workspace.
            </p>
          </div>

          <div className="border border-black/10 px-5 py-4">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-black/40">
              YOUR ROLE
            </p>

            <p className="mt-1 text-sm font-semibold">
              {currentRole}
            </p>
          </div>
        </header>

        {/* TEAM SUMMARY */}
        <section className="grid border-b border-black/10 sm:grid-cols-3">
          <div className="border-b border-black/10 py-7 sm:border-b-0 sm:border-r sm:pr-8">
            <p className="text-xs tracking-[0.15em] text-black/40">
              MEMBERS
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {members.length}
            </p>
          </div>

          <div className="border-b border-black/10 py-7 sm:border-b-0 sm:border-r sm:px-8">
            <p className="text-xs tracking-[0.15em] text-black/40">
              ADMINS
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {
                members.filter(
                  (member) =>
                    member.role === "OWNER" ||
                    member.role === "ADMIN"
                ).length
              }
            </p>
          </div>

          <div className="py-7 sm:pl-8">
            <p className="text-xs tracking-[0.15em] text-black/40">
              ORGANIZATION
            </p>

            <p className="mt-2 truncate text-lg font-medium">
              {organization.name}
            </p>
          </div>
        </section>

        {/* MEMBERS */}
        <section className="pt-12">

          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
                MEMBERS / {String(members.length).padStart(2, "0")}
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                People in this workspace
              </h2>
            </div>
          </div>

          <div className="border-t border-black/10">

            {members.map((member, index) => (
              <div
                key={member.id}
                className="grid gap-4 border-b border-black/10 py-6 sm:grid-cols-[60px_1fr_auto] sm:items-center"
              >

                {/* NUMBER */}
                <span className="text-xs font-medium tracking-[0.15em] text-black/30">
                  {String(index + 1).padStart(2, "0")}
                </span>

                {/* USER */}
                <div>
                  <p className="font-medium">
                    {member.user.name ?? "Unnamed user"}
                  </p>

                  <p className="mt-1 text-sm text-black/45">
                    {member.user.email}
                  </p>
                </div>

                {/* ROLE */}
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-black" />

                  <span className="text-xs font-semibold tracking-[0.15em]">
                    {member.role}
                  </span>
                </div>

              </div>
            ))}

          </div>
        </section>

      </div>
    </main>
  );
}