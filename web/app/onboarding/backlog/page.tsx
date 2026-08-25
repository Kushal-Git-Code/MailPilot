import { createClient } from "@/lib/supabase/server";
import { BacklogForm } from "./backlog-form";
import { StepIndicator } from "../step-indicator";

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
      <div className="blob blob-1 -left-16 top-10 h-72 w-72 bg-violet" />
      <div className="blob blob-2 -bottom-20 -right-16 h-80 w-80 bg-accent" />

      <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/70 bg-surface/85 p-10 text-center shadow-glow backdrop-blur-xl">
        <StepIndicator step={2} />

        <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-gold shadow-glow">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[30px] w-[30px]">
            <rect x="3" y="4" width="18" height="17" rx="3" stroke="#fff" strokeWidth="1.8" />
            <path d="M3 9H21" stroke="#fff" strokeWidth="1.8" />
            <path d="M8 2.5V6M16 2.5V6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="font-display text-xl font-extrabold text-foreground">Choose your backlog range</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          {token ? (
            <>
              MailPilot will scan <span className="font-semibold text-foreground">{token.gmail_address}</span>&apos;s
              past emails to build your first triage. Pick how far back to go.
            </>
          ) : (
            "Connect Gmail first to pick a backlog range."
          )}
        </p>

        {token && (
          <div className="mt-7">
            <BacklogForm />
          </div>
        )}
      </div>
    </main>
  );
}
