// Placeholder — the real onboarding UI is built in Phase 4 (Step 15).
// Exists now only so Step 12's Gmail OAuth flow has a real trigger to test.
export default function ConnectGmailPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">Connect Gmail (placeholder)</h1>
      {searchParams.error && (
        <p className="text-xs text-error">
          Something went wrong connecting Gmail. Please try again.
        </p>
      )}
      {searchParams.message === "disconnected" && (
        <p className="text-xs text-text-secondary">
          Gmail disconnected. Reconnect anytime — your account and data are safe.
        </p>
      )}
      <a
        href="/api/auth/gmail/connect"
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Connect Gmail
      </a>
    </main>
  );
}
