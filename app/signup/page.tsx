"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  

 const callbackUrl = "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to create your account.");
        return;
      }

      router.push(
        `/login?created=true&callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f4ef",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#fff",
          border: "1px solid #deddd7",
          padding: "40px",
          boxShadow: "8px 8px 0 #111",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            letterSpacing: "2px",
            fontWeight: 700,
            marginBottom: "18px",
          }}
        >
          SAAS PLATFORM / ACCOUNT
        </div>

        <h1
          style={{
            fontSize: "42px",
            lineHeight: 1,
            margin: "0 0 14px",
            color: "#111",
          }}
        >
          Create your account.
        </h1>

        <p
          style={{
            color: "#666",
            lineHeight: 1.6,
            marginBottom: "30px",
          }}
        >
          Start your workspace and invite your team when you're ready.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: "18px" }}>
            <span
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "7px",
              }}
            >
              NAME
            </span>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                border: "1px solid #ccc",
                background: "#fafafa",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "18px" }}>
            <span
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "7px",
              }}
            >
              EMAIL
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                border: "1px solid #ccc",
                background: "#fafafa",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: "20px" }}>
            <span
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 700,
                marginBottom: "7px",
              }}
            >
              PASSWORD
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px",
                border: "1px solid #ccc",
                background: "#fafafa",
              }}
            />
          </label>

          {error && (
            <div
              style={{
                marginBottom: "18px",
                padding: "12px",
                border: "1px solid #d8aaa4",
                background: "#fff5f3",
                color: "#8d3025",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              border: "none",
              background: "#111",
              color: "#fff",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating account..." : "Create account →"}
          </button>
        </form>

        <p
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "13px",
            color: "#666",
          }}
        >
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            style={{ color: "#111", fontWeight: 700 }}
          >
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}