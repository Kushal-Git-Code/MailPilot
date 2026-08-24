"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Deliberately neutral, not colored like CorrectionButton — undo isn't on
// the escalate/de-escalate priority axis, it's a safety-net "put it back
// exactly" action, so it doesn't carry the same directional meaning.
export function UndoButton({ emailId }: { emailId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const res = await fetch(`/api/emails/${emailId}/undo`, { method: "POST" });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="group inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-text-secondary transition-all hover:-translate-y-0.5 hover:border-accent hover:text-accent disabled:opacity-50"
    >
      <svg
        className="h-3 w-3 shrink-0 transition-transform group-hover:-rotate-[20deg]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7v6h6M3 13a9 9 0 1 0 2.6-6.4" />
      </svg>
      {loading ? "..." : "Undo"}
    </button>
  );
}
