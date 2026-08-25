import { ConnectButton } from "./connect-button";
import { StepIndicator } from "../step-indicator";

export default function ConnectGmailPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-8">
      <div className="blob blob-1 -left-20 -top-20 h-72 w-72 bg-violet" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-sky" />
      <div className="blob -bottom-32 left-1/3 h-64 w-64 bg-accent opacity-20" />

      <div className="relative z-10 w-full max-w-md rounded-[26px] border border-white/70 bg-surface/85 p-10 text-center shadow-glow backdrop-blur-xl">
        <StepIndicator step={1} />

        <div className="mx-auto mb-5 flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-gold shadow-glow">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-[30px] w-[30px]">
            <rect x="2" y="5" width="20" height="14" rx="3" fill="#fff" fillOpacity="0.25" />
            <path d="M3 6.5L12 13L21 6.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="font-display text-xl font-extrabold text-foreground">Connect your Gmail</h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          MailPilot needs permission to read and label your Gmail so it can automatically triage
          your inbox.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-error/10 px-4 py-2 text-xs text-error">
            Something went wrong connecting Gmail. Please try again.
          </p>
        )}
        {searchParams.message === "disconnected" && (
          <p className="mt-4 rounded-lg bg-surface-tint px-4 py-2 text-xs text-text-secondary">
            Gmail disconnected. Reconnect anytime — your account and data are safe.
          </p>
        )}

        <div className="mt-7">
          <ConnectButton />
        </div>

        <p className="mt-5 rounded-xl bg-surface-tint px-4 py-2.5 text-xs leading-relaxed text-text-secondary">
          We only ask for what&apos;s needed to classify and label mail — we never store your
          email content, only classification results.
        </p>
      </div>
    </main>
  );
}
