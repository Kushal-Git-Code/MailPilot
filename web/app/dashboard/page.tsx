import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

// Placeholder — the real dashboard is built in Phase 6. This exists now
// only so Step 11's protected-route middleware has a real route to guard.
export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Dashboard placeholder</h1>
      <p className="text-sm text-text-secondary">Logged in as {user?.email}</p>
      <LogoutButton />
      <form action="/api/gmail/disconnect" method="POST">
        <button
          type="submit"
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background"
        >
          Disconnect Gmail
        </button>
      </form>
    </main>
  );
}
