"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptInvitationButton({
  token,
}: {
  token: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAccept() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/invitations/${token}/accept`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ?? "Unable to accept invitation."
        );
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="invite-button"
        onClick={handleAccept}
        disabled={loading}
      >
        {loading
          ? "Accepting..."
          : "Accept invitation →"}
      </button>

      {error && (
        <p
          style={{
            marginTop: "14px",
            color: "#a33",
            fontSize: "13px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}