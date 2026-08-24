"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Priority (urgent vs. calm) and category (Primary/Alerts/Newsletters/…) are
// independent axes — marking something "not priority" doesn't make it
// Primary, it could stay any category with just the urgency removed. So
// "Not priority" doesn't borrow a category color; it gets its own neutral
// slate. "Mark as priority" is coral — the same judgment as the Needs You
// badge, genuinely the same axis. (Phase 8 design review, section 09.)
export function CorrectionButton({ emailId, currentPriority }: { emailId: string; currentPriority: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await fetch(`/api/emails/${emailId}/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: !currentPriority }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  const colorClasses = currentPriority
    ? "border-border bg-surface-tint text-text-secondary hover:bg-text-secondary hover:text-white hover:border-transparent"
    : "border-coral/40 bg-coral/10 text-coral hover:bg-coral hover:text-white hover:border-transparent";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-glow active:translate-y-0 active:scale-95 disabled:opacity-50 ${colorClasses}`}
    >
      {currentPriority ? (
        <svg
          className="h-3 w-3 shrink-0 transition-transform group-hover:rotate-[15deg] group-hover:scale-110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      ) : (
        <svg
          className="h-3 w-3 shrink-0 transition-transform group-hover:scale-[1.15] group-hover:-rotate-[8deg]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 3v18M5 4h10l-2.5 3.5L15 11H5" />
        </svg>
      )}
      {loading ? "..." : currentPriority ? "Not priority" : "Mark as priority"}
    </button>
  );
}
