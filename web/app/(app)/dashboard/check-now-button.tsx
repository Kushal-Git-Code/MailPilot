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
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-accent to-gold px-4 py-2 text-xs font-bold text-white shadow-glow transition-transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5 shrink-0"
        aria-hidden="true"
      >
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
      </svg>
      {status === "loading"
        ? "Refreshing…"
        : status === "queued"
          ? "Queued — refresh shortly"
          : status === "error"
            ? "Couldn't start check"
            : "Refresh & Triage"}
    </button>
  );
}
