import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-xl font-semibold text-foreground">MailPilot</h1>
      <p className="max-w-md text-sm text-text-secondary">
        MailPilot triages your Gmail inbox automatically, so you only open what
        actually needs you.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        Start Free
      </Link>
    </main>
  );
}
