import { SettingsTabs } from "../settings-tabs";

// SettingsTabs has no async dependency, so it's rendered for real here
// (not skeletonized) — the tab bar appears instantly and stays in place
// while just the content below it streams in, rather than the whole
// header flashing between a fake and real version.
export default function SettingsAccountLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6 animate-pulse">
          <div className="h-6 w-20 rounded-md bg-surface" />
          <div className="mt-2 h-3 w-24 rounded bg-surface" />
        </header>

        <SettingsTabs active="account" />

        <div className="animate-pulse">
          <section className="rounded-2xl bg-surface p-6 shadow-glow">
            <div className="h-3.5 w-24 rounded bg-background" />
            <div className="mt-2 h-3.5 w-40 rounded bg-background" />
          </section>
          <section className="mt-4 rounded-2xl bg-surface p-6 shadow-glow">
            <div className="h-3.5 w-32 rounded bg-background" />
            <div className="mt-2 h-3.5 w-48 rounded bg-background" />
            <div className="mt-4 h-9 w-32 rounded-lg bg-background" />
          </section>
        </div>
      </div>
    </main>
  );
}
