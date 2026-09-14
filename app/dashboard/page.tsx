import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] p-8 text-[#151515]">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold tracking-[0.2em] text-black/40">
          WORKSPACE
        </p>

        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Dashboard
        </h1>

        <p className="mt-3 text-black/50">
          Welcome, {session.user.name ?? session.user.email}
        </p>
      </div>
    </main>
  );
}