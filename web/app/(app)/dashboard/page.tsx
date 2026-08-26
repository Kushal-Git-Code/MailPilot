import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGmailClientForUser } from "@/lib/gmail";
import { getEmailDisplayInfo } from "@/lib/gmailDisplay";
import { getLatestSession } from "@/lib/triageSession";
import { hasActiveBacklogJob } from "@/lib/backlogJob";
import { displayNameFromHeader } from "@/lib/avatarColor";
import { CheckNowButton } from "./check-now-button";
import { ScanProgressBanner } from "./scan-progress-banner";
import { GreetingBanner } from "./greeting-banner";
import { GlanceTiles } from "./glance-tiles";

function firstNameFrom(name: string): string {
  if (!name) return "";
  return name.includes("@") ? name.split("@")[0] : name.split(" ")[0];
}

// This page's data (classifications, corrections, undo availability) can
// change from one visit to the next — never let Next.js cache a stale
// server-rendered response here.
export const dynamic = "force-dynamic";

// Rows-only dashboard, matching Tame's real structure exactly: four rows
// (Has Deadlines / Quick Replies / Needs Your Attention / FYI Only), not
// four action rows *plus* four category rows -- that combination was tried
// and correctly rejected (it doubled the row count instead of replacing
// it, defeating the whole "scan it in two seconds" point). Every row links
// into /dashboard/all (pre-filtered) for the real list, corrections, undo,
// etc. -- that page owns all of that now, this one doesn't duplicate it.
export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already guards this route

  // Gmail-client init (a real network round trip when the cached access
  // token has expired) and the emails query don't depend on each other —
  // running them in parallel instead of sequentially is a straightforward
  // win, not a micro-optimization: it's one full round trip removed from
  // every dashboard load.
  const [gmail, { data: flaggedEmails }] = await Promise.all([
    getGmailClientForUser(user.id),
    supabase
      .from("emails")
      .select("id, gmail_message_id, has_deadline, quick_reply_candidate")
      .eq("user_id", user.id)
      .eq("priority_flagged", true)
      .order("received_at", { ascending: false }),
  ]);

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

  // Precedence for priority-flagged mail, matching Tame's action-oriented
  // buckets: Has Deadlines first (a missed deadline has a real cost, so it
  // must never get buried behind an easier-looking Quick Reply), then
  // Quick Replies (the easy wins that aren't also deadline-critical), then
  // Needs Your Attention (everything else needing real judgment -- no
  // shortcut, no clock). Everything NOT priority-flagged is FYI Only,
  // regardless of category -- category-level rows were the mistake this
  // replaces.
  const allFlagged = flaggedEmails ?? [];
  const deadlineEmails = allFlagged.filter((e) => e.has_deadline);
  const quickReplyEmails = allFlagged.filter((e) => !e.has_deadline && e.quick_reply_candidate);
  const needsAttentionEmails = allFlagged.filter((e) => !e.has_deadline && !e.quick_reply_candidate);

  // Only the first few of each bucket need real Gmail lookups -- each row
  // shows a max of 3 sample senders, no reason to fetch display info for
  // the rest here (the full list, and everyone's sender names, live on
  // /dashboard/all).
  const previewIdsFor = (list: { gmail_message_id: string }[]) => list.slice(0, 3).map((e) => e.gmail_message_id);
  const deadlinePreviewIds = previewIdsFor(deadlineEmails);
  const quickReplyPreviewIds = previewIdsFor(quickReplyEmails);
  const needsAttentionPreviewIds = previewIdsFor(needsAttentionEmails);

  // None of these depend on each other's results — see the comment on each
  // for what it needs. Running them as sequential awaits was several round
  // trips stacked back to back for no reason; Promise.all collapses that
  // to one.
  const [fyiCountResult, fyiSample, latestSession, scanning] = await Promise.all([
    supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("priority_flagged", false),
    supabase
      .from("emails")
      .select("gmail_message_id")
      .eq("user_id", user.id)
      .eq("priority_flagged", false)
      .order("received_at", { ascending: false })
      .limit(3),
    getLatestSession(supabase, user.id),
    hasActiveBacklogJob(supabase, user.id),
  ]);

  const fyiCount = fyiCountResult.count ?? 0;
  const fyiPreviewIds = (fyiSample.data ?? []).map((row) => row.gmail_message_id as string);

  // One combined Gmail lookup for all four buckets' sample senders instead
  // of four separate round trips.
  const allPreviewIds = [...deadlinePreviewIds, ...quickReplyPreviewIds, ...needsAttentionPreviewIds, ...fyiPreviewIds];
  const priorityDisplayMap =
    allPreviewIds.length > 0 ? await getEmailDisplayInfo(gmail, allPreviewIds) : new Map();

  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "";
  const firstName = firstNameFrom(displayName);

  const senderPreviewFor = (ids: string[]) =>
    ids.map((id) => displayNameFromHeader(priorityDisplayMap.get(id)?.from ?? "(unknown sender)"));

  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <GreetingBanner firstName={firstName} session={latestSession} />

        <header className="mb-6 flex items-center justify-between gap-4">
          <Link href="/dashboard/all" className="text-xs font-medium text-accent hover:underline">
            Browse all mail &rarr;
          </Link>
          <CheckNowButton />
        </header>

        <ScanProgressBanner initiallyActive={scanning} />

        <GlanceTiles
          deadlineCount={deadlineEmails.length}
          deadlineSenderPreview={senderPreviewFor(deadlinePreviewIds)}
          quickReplyCount={quickReplyEmails.length}
          quickReplySenderPreview={senderPreviewFor(quickReplyPreviewIds)}
          needsAttentionCount={needsAttentionEmails.length}
          needsAttentionSenderPreview={senderPreviewFor(needsAttentionPreviewIds)}
          fyiCount={fyiCount}
          fyiSenderPreview={senderPreviewFor(fyiPreviewIds)}
        />
      </div>
    </main>
  );
}
