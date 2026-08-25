import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettingsTabs } from "../settings-tabs";

// Same reasoning as /dashboard: connection status can change between visits
// (disconnect happens elsewhere, revocation can happen at Google's end), so
// this must never be served from a stale cache.
export const dynamic = "force-dynamic";

export default async function SettingsAccountPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already guards this route

  const { data: tokenRow } = await supabase
    .from("gmail_tokens")
    .select("gmail_address, status, connected_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const isConnected = tokenRow?.status === "active";

  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-xl font-bold text-foreground">Account</h1>
          <Link href="/dashboard" className="text-xs font-medium text-accent hover:underline">
            &larr; Back to inbox
          </Link>
        </header>

        <SettingsTabs active="account" />

        <section className="rounded-2xl bg-surface p-6 shadow-glow">
          <h2 className="text-sm font-semibold text-foreground">Your account</h2>
          <p className="mt-1 text-sm text-text-secondary">{user.email}</p>
        </section>

        <section className="mt-4 rounded-2xl bg-surface p-6 shadow-glow">
          <h2 className="text-sm font-semibold text-foreground">Gmail connection</h2>
          {isConnected ? (
            <>
              <p className="mt-1 text-sm text-text-secondary">
                Connected to <span className="text-foreground">{tokenRow!.gmail_address}</span>
              </p>
              <form action="/api/gmail/disconnect" method="POST" className="mt-4">
                <button
                  type="submit"
                  className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface"
                >
                  Disconnect Gmail
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-text-secondary">No Gmail account connected.</p>
              <Link
                href="/onboarding/connect"
                className="mt-4 inline-block rounded-xl bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
              >
                Connect Gmail
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
