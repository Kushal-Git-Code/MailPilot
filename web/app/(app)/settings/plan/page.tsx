import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DAILY_CAP } from "shared";
import { SettingsTabs } from "../settings-tabs";

// Usage numbers change as the worker classifies mail in the background —
// never serve a stale cached count here.
export const dynamic = "force-dynamic";

const RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatResetIn(ms: number): string {
  if (ms <= 0) return "now";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default async function SettingsPlanPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already guards this route

  const { data: userRow } = await supabase
    .from("users")
    .select("plan, daily_email_count, daily_count_reset_at")
    .eq("id", user.id)
    .single();

  // Display-only: mirrors the worker's rolling-24h reset logic
  // (worker/src/limits/dailyCap.ts) without writing anything — a settings
  // page render should never have the side effect of mutating usage state.
  // The worker performs the actual reset lazily on the next classification
  // job, same as it always has; this just reflects what that will show.
  const resetAtMs = userRow ? new Date(userRow.daily_count_reset_at).getTime() : Date.now();
  const windowElapsed = Date.now() - resetAtMs >= RESET_WINDOW_MS;
  const used = windowElapsed ? 0 : (userRow?.daily_email_count ?? 0);
  const remaining = Math.max(0, DAILY_CAP - used);
  const resetInMs = windowElapsed ? 0 : resetAtMs + RESET_WINDOW_MS - Date.now();
  const percentUsed = Math.min(100, Math.round((used / DAILY_CAP) * 100));

  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Plan &amp; usage</h1>
          <Link href="/dashboard" className="text-xs font-medium text-accent hover:underline">
            &larr; Back to inbox
          </Link>
        </header>

        <SettingsTabs active="plan" />

        <section className="rounded-2xl bg-surface p-6 shadow-glow">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {userRow?.plan === "free" ? "Free plan" : (userRow?.plan ?? "Free plan")}
            </h2>
            <p className="text-xs text-text-secondary">
              {used} / {DAILY_CAP} emails today
            </p>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-all"
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <p className="mt-3 text-xs text-text-secondary">
            {remaining > 0
              ? `${remaining} email${remaining === 1 ? "" : "s"} left today.`
              : "Today's limit reached — remaining mail will be classified once your cap resets."}{" "}
            {!windowElapsed && `Resets in ${formatResetIn(resetInMs)}.`}
          </p>
        </section>
      </div>
    </main>
  );
}
