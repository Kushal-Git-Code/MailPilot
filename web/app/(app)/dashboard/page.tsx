import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGmailClientForUser } from "@/lib/gmail";
import { getEmailDisplayInfo } from "@/lib/gmailDisplay";
import { getUndoableEmailIds } from "@/lib/undoability";
import { getLatestSession } from "@/lib/triageSession";
import { hasActiveBacklogJob } from "@/lib/backlogJob";
import { LogoutButton } from "./logout-button";
import { PriorityList, type PriorityListItem } from "./priority-list";
import { SessionSummary } from "./session-summary";
import { CheckNowButton } from "./check-now-button";
import { ScanProgressBanner } from "./scan-progress-banner";

// This page's data (classifications, corrections, undo availability) can
// change from one visit to the next — never let Next.js cache a stale
// server-rendered response here.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already guards this route

  const gmail = await getGmailClientForUser(user.id);

  if (!gmail) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-8">
        <div className="blob blob-1 -left-20 -top-20 h-72 w-72 bg-accent" />
        <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-secondary" />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-glow">
          <h1 className="font-display text-xl font-bold text-foreground">Gmail not connected</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Connect your Gmail account to start seeing your triaged inbox here.
          </p>
          <Link
            href="/onboarding/connect"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Connect Gmail
          </Link>
        </div>
      </main>
    );
  }

  const { data: flaggedEmails } = await supabase
    .from("emails")
    .select("id, gmail_message_id, gmail_thread_id, classification_reason, received_at, category")
    .eq("user_id", user.id)
    .eq("priority_flagged", true)
    .order("received_at", { ascending: false });

  const emails = flaggedEmails ?? [];
  const displayMap =
    emails.length > 0
      ? await getEmailDisplayInfo(
          gmail,
          emails.map((e) => e.gmail_message_id)
        )
      : new Map();

  const undoableIds =
    emails.length > 0
      ? await getUndoableEmailIds(
          supabase,
          user.id,
          emails.map((e) => e.id)
        )
      : new Set<string>();

  const latestSession = await getLatestSession(supabase, user.id);
  const scanning = await hasActiveBacklogJob(supabase, user.id);

  const items: PriorityListItem[] = emails.map((e) => {
    const info = displayMap.get(e.gmail_message_id);
    return {
      id: e.id,
      gmailThreadId: e.gmail_thread_id,
      from: info?.from ?? "(unknown sender)",
      subject: info?.subject ?? "(no subject)",
      reason: e.classification_reason ?? "",
      receivedAt: e.received_at,
      category: e.category,
      undoable: undoableIds.has(e.id),
    };
  });

  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {items.length > 0 ? `Needs You (${items.length})` : "MailPilot"}
            </h1>
            <Link href="/dashboard/all" className="text-xs font-medium text-accent hover:underline">
              Browse all mail &rarr;
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <CheckNowButton />
            <form action="/api/gmail/disconnect" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-background"
              >
                Disconnect Gmail
              </button>
            </form>
            <LogoutButton />
          </div>
        </header>

        <ScanProgressBanner initiallyActive={scanning} />

        <SessionSummary session={latestSession} />

        {items.length === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center shadow-glow">
            <h2 className="font-display text-xl font-bold text-foreground">
              {scanning ? "Scanning your inbox…" : "You're all caught up"}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {scanning
                ? "MailPilot is going through your backlog now — anything that needs you will show up here as it's found."
                : "MailPilot is watching your inbox — you'll see anything that needs you here."}
            </p>
          </div>
        ) : (
          <PriorityList items={items} />
        )}
      </div>
    </main>
  );
}
