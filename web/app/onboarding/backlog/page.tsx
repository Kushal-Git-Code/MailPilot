import { createClient } from "@/lib/supabase/server";
import { BacklogForm } from "./backlog-form";

export default async function BacklogPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: token } = await supabase
    .from("gmail_tokens")
    .select("gmail_address")
    .eq("user_id", user?.id)
    .single();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-8">
      <div className="blob blob-1 -left-16 top-10 h-72 w-72 bg-tertiary" />
      <div className="blob blob-2 -bottom-20 -right-16 h-80 w-80 bg-accent" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-glow">
        <h1 className="text-xl font-semibold text-foreground">Choose your backlog range</h1>
        <p className="mt-3 text-sm text-text-secondary">
          {token
            ? `MailPilot will scan ${token.gmail_address}'s past emails to build your first triage. Pick how far back to go.`
            : "Connect Gmail first to pick a backlog range."}
        </p>

        {token && (
          <div className="mt-6">
            <BacklogForm />
          </div>
        )}
      </div>
    </main>
  );
}
