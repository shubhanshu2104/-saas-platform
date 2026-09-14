"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#151515]">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.1fr_0.9fr]">

        {/* LEFT — BRAND */}
        <section className="relative hidden overflow-hidden border-r border-black/10 p-12 lg:flex lg:flex-col lg:justify-between">

          <div className="flex items-center gap-3 text-sm font-medium tracking-[0.2em]">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            SAAS PLATFORM
          </div>

          <div className="max-w-xl">
            <p className="mb-6 text-xs font-semibold tracking-[0.3em] text-black/45">
              WORKSPACE / 02
            </p>

            <h1 className="text-6xl font-semibold leading-[0.9] tracking-[-0.06em] xl:text-8xl">
              Welcome
              <br />
              back.
            </h1>

            <p className="mt-8 max-w-md text-base leading-7 text-black/55">
              Your workspace, team permissions, usage and
              billing — all in one controlled environment.
            </p>
          </div>

          <div className="flex items-end justify-between text-xs tracking-[0.18em] text-black/40">
            <span>SECURE ACCESS / JWT SESSION</span>
            <span>v0.1</span>
          </div>
        </section>

        {/* RIGHT — FORM */}
        <section className="flex items-center justify-center p-6 sm:p-10 lg:p-16">
          <div className="w-full max-w-md">

            <div className="mb-12">
              <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-black/40">
                SIGN IN
              </p>

              <h2 className="text-3xl font-semibold tracking-[-0.04em]">
                Enter your workspace.
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/50">
                Sign in using the credentials you created
                during registration.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-semibold tracking-[0.15em]"
                >
                  EMAIL
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                  className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base outline-none transition placeholder:text-black/25 focus:border-black"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-semibold tracking-[0.15em]"
                >
                  PASSWORD
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Your password"
                  className="w-full border-b border-black/20 bg-transparent px-0 py-3 text-base outline-none transition placeholder:text-black/25 focus:border-black"
                />
              </div>

              {/* ERROR */}
              {error && (
                <div
                  role="alert"
                  className="border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="group mt-4 flex w-full items-center justify-between border border-black bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-transparent hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>
                  {loading ? "AUTHENTICATING..." : "ENTER WORKSPACE"}
                </span>

                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-black/45">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="font-medium text-black underline underline-offset-4"
              >
                Create one
              </a>
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}