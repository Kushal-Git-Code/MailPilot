import { SettingsTabs } from "../settings-tabs";

export default function SettingsCategoriesLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6 animate-pulse">
          <div className="h-6 w-28 rounded-md bg-surface" />
          <div className="mt-2 h-3 w-24 rounded bg-surface" />
        </header>

        <SettingsTabs active="categories" />

        <div className="animate-pulse space-y-3">
          <div className="h-24 rounded-2xl bg-surface" />
          <div className="h-14 rounded-2xl bg-surface" />
          <div className="h-14 rounded-2xl bg-surface" />
        </div>
      </div>
    </main>
  );
}
