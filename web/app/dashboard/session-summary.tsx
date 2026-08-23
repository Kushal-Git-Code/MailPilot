import type { LatestSession } from "@/lib/triageSession";

// Session-based, matching how MailPilot actually works today (manually
// triggered scans, no ongoing polling yet) — not a rolling 24h window.
// Revisit once ongoing polling exists.
export function SessionSummary({ session }: { session: LatestSession | null }) {
  if (!session) return null;

  const noActionCount = session.processedCount - session.priorityCount;
  const completedAt = new Date(session.completedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-surface px-4 py-3 text-xs text-text-secondary">
      <span>
        <span className="font-semibold text-foreground">{session.processedCount}</span> triaged
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <span className="font-semibold text-foreground">{session.priorityCount}</span> flagged
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <span className="font-semibold text-foreground">{noActionCount}</span> no action needed
      </span>
      <span className="ml-auto">Last scan: {completedAt}</span>
    </div>
  );
}
