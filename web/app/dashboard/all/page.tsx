import { createClient } from "@/lib/supabase/server";
import { getGmailClientForUser } from "@/lib/gmail";
import { getEmailDisplayInfo } from "@/lib/gmailDisplay";
import { LogoutButton } from "../logout-button";
import { AllEmailsList, type AllEmailsItem } from "./all-list";

export default async function AllEmailsPage() {
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
          <h1 className="text-xl font-semibold text-foreground">Gmail not connected</h1>
          <p className="mt-3 text-sm text-text-secondary">
            Connect your Gmail account to start seeing your triaged inbox here.
          </p>
          <a
            href="/onboarding/connect"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Connect Gmail
          </a>
        </div>
      </main>
    );
  }

  // Capped so live-fetch cost stays bounded regardless of how much history
  // has accumulated — most recent first, since that's what's relevant day
  // to day. Full pagination isn't built yet; this keeps the page fast in
  // the meantime rather than degrading as the account ages.
  const MAX_EMAILS = 150;

  const { data: allEmails } = await supabase
    .from("emails")
    .select("id, gmail_message_id, gmail_thread_id, classification_reason, category, priority_flagged, received_at")
    .eq("user_id", user.id)
    .order("received_at", { ascending: false })
    .limit(MAX_EMAILS);

  const emails = allEmails ?? [];
  const displayMap =
    emails.length > 0
      ? await getEmailDisplayInfo(
          gmail,
          emails.map((e) => e.gmail_message_id)
        )
      : new Map();

  const items: AllEmailsItem[] = emails.map((e) => {
    const info = displayMap.get(e.gmail_message_id);
    return {
      id: e.id,
      gmailThreadId: e.gmail_thread_id,
      from: info?.from ?? "(unknown sender)",
      subject: info?.subject ?? "(no subject)",
      reason: e.classification_reason ?? "",
      receivedAt: e.received_at,
      category: e.category,
      priorityFlagged: e.priority_flagged,
    };
  });

  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">All Mail</h1>
            <a href="/dashboard" className="text-xs font-medium text-accent hover:underline">
              &larr; Back to Needs You
            </a>
            {emails.length === MAX_EMAILS && (
              <p className="mt-1 text-xs text-text-secondary">Showing your most recent {MAX_EMAILS}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
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

        {items.length === 0 ? (
          <div className="rounded-2xl bg-surface p-10 text-center shadow-glow">
            <h2 className="text-xl font-semibold text-foreground">Nothing classified yet</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Once MailPilot processes your inbox, everything will show up here.
            </p>
          </div>
        ) : (
          <AllEmailsList items={items} />
        )}
      </div>
    </main>
  );
}
