export default function AllEmailsLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl animate-pulse">
        <header className="mb-6">
          <div className="h-6 w-24 rounded-md bg-surface" />
          <div className="mt-2 h-3 w-28 rounded bg-surface" />
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-surface" />
          ))}
        </div>

        <ul className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-4">
                <div className="h-3.5 w-40 rounded bg-background" />
                <div className="h-3 w-10 rounded bg-background" />
              </div>
              <div className="mt-2 h-3.5 w-2/3 rounded bg-background" />
              <div className="mt-3 flex justify-end gap-2">
                <div className="h-7 w-24 rounded-full bg-background" />
                <div className="h-7 w-16 rounded-full bg-background" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
