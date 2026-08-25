import { SettingsTabs } from "../settings-tabs";

export default function SettingsPlanLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6 animate-pulse">
          <div className="h-6 w-28 rounded-md bg-surface" />
          <div className="mt-2 h-3 w-24 rounded bg-surface" />
        </header>

        <SettingsTabs active="plan" />

        <section className="animate-pulse rounded-2xl bg-surface p-6 shadow-glow">
          <div className="flex items-baseline justify-between">
            <div className="h-3.5 w-20 rounded bg-background" />
            <div className="h-3 w-24 rounded bg-background" />
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-background" />
          <div className="mt-3 h-3 w-40 rounded bg-background" />
        </section>
      </div>
    </main>
  );
}
