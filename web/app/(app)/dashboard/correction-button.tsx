"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50"
    >
      {loading ? "..." : currentPriority ? "Not priority" : "Mark as priority"}
    </button>
  );
}
