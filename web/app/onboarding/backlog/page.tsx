import { createClient } from "@/lib/supabase/server";

// Placeholder — the real backlog date-range picker is built in Phase 4
// (Step 15). Exists now only to confirm Step 12's Gmail OAuth flow
// actually wrote a row to gmail_tokens for the current user.
export default async function BacklogPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: token } = await supabase
    .from("gmail_tokens")
    .select("gmail_address, status, connected_at")
    .eq("user_id", user?.id)
    .single();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Backlog range (placeholder)</h1>
      {token ? (
        <p className="text-sm text-text-secondary">
          Gmail connected: {token.gmail_address} (status: {token.status})
        </p>
      ) : (
        <p className="text-sm text-error">No gmail_tokens row found for this user.</p>
      )}
    </main>
  );
}
