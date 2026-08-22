import { ConnectButton } from "./connect-button";

export default function ConnectGmailPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-8">
      <div className="blob blob-1 -left-20 -top-20 h-72 w-72 bg-accent" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-secondary" />
      <div className="blob -bottom-32 left-1/3 h-64 w-64 bg-tertiary opacity-20" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-surface p-8 text-center shadow-glow">
        <h1 className="text-xl font-semibold text-foreground">Connect your Gmail</h1>
        <p className="mt-3 text-sm text-text-secondary">
          MailPilot needs permission to read and label your Gmail so it can automatically
          triage your inbox. We only ask for what&apos;s needed to classify and label mail —
          we never store your email content, only classification results.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-error/10 px-4 py-2 text-xs text-error">
            Something went wrong connecting Gmail. Please try again.
          </p>
        )}
        {searchParams.message === "disconnected" && (
          <p className="mt-4 rounded-lg bg-tertiary/10 px-4 py-2 text-xs text-text-secondary">
            Gmail disconnected. Reconnect anytime — your account and data are safe.
          </p>
        )}

        <div className="mt-6">
          <ConnectButton />
        </div>
      </div>
    </main>
  );
}
