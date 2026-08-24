"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "queued" | "error";

// Enqueues a job — doesn't complete synchronously the way corrections/undo
// do, since classification genuinely takes real time. Deliberately doesn't
// promise a specific timing or auto-refresh on a guessed delay; it just
// confirms the check was queued and lets the user look again when ready.
export function CheckNowButton() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleClick() {
    setStatus("loading");
    const res = await fetch("/api/onboarding/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateRange: "forward" }),
    });
    setStatus(res.ok ? "queued" : "error");
    if (res.ok) {
      setTimeout(() => setStatus("idle"), 4000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === "loading"}
      className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-background disabled:opacity-50"
    >
      {status === "loading"
        ? "Checking..."
        : status === "queued"
          ? "Queued — refresh shortly"
          : status === "error"
            ? "Couldn't start check"
            : "Check now"}
    </button>
  );
}
