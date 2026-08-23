"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      className="shrink-0 text-[11px] font-medium text-text-secondary underline decoration-dotted transition-colors hover:text-foreground disabled:opacity-50"
    >
      {loading ? "..." : "Undo"}
    </button>
  );
}
