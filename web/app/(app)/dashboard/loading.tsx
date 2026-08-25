// Next.js automatically wraps page.tsx in a Suspense boundary using this
// file as the fallback — shown the instant a navigation to /dashboard
// starts (Link click or router.push), before any of the page's async
// Gmail/Supabase work even begins. Without this, the browser shows nothing
// at all until that work finishes, which reads as "stuck" and invites a
// second click that doesn't actually do anything new.
export default function DashboardLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl animate-pulse">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="h-6 w-32 rounded-md bg-surface" />
            <div className="mt-2 h-3 w-24 rounded bg-surface" />
          </div>
          <div className="h-8 w-20 rounded-lg bg-surface" />
        </header>

        <div className="mb-5 h-14 rounded-2xl bg-surface" />

        <ul className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-background" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-28 rounded bg-background" />
                    <div className="h-3.5 w-16 rounded-md bg-background" />
                  </div>
                  <div className="mt-2 h-3.5 w-3/4 rounded bg-background" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-background" />
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <div className="h-7 w-16 rounded-full bg-background" />
                <div className="h-7 w-24 rounded-full bg-background" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
