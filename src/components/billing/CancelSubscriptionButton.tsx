
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelSubscriptionButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ?? "Unable to schedule cancellation."
        );
      }

      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setConfirming(true);
          }}
          className="text-sm font-medium text-red-700 underline underline-offset-4 transition hover:text-red-900"
        >
          Cancel subscription
        </button>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md border border-red-900/20 bg-white/60 p-5">
      <p className="font-semibold">Schedule cancellation?</p>

      <p className="mt-2 text-sm leading-6 text-black/60">
        Your paid subscription will be requested to end at the
        end of the current billing period. You should retain paid
        access until then, subject to provider confirmation.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleCancel}
          className="bg-red-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Scheduling…" : "Confirm cancellation"}
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setConfirming(false);
            setError("");
          }}
          className="border border-black/15 px-4 py-2.5 text-sm font-semibold transition hover:bg-black/5 disabled:opacity-50"
        >
          Keep subscription
        </button>
      </div>
    </div>
  );
}
