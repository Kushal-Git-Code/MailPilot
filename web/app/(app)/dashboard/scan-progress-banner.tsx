"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Polls while a backlog scan (onboarding's first run, or a "Check now") is
// in flight, refreshing the dashboard's server data each tick so newly
// classified emails appear live instead of requiring a manual reload —
// that live fill-in is the whole point of dropping the user straight into
// the dashboard rather than making them wait on a static onboarding screen.
export function ScanProgressBanner({ initiallyActive }: { initiallyActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(initiallyActive);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) return;

    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/onboarding/backlog/status");
      const data = await res.json().catch(() => ({ active: false }));
      router.refresh();
      if (!data.active) {
        setActive(false);
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, router]);

  if (!active) return null;

  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold" />
      </span>
      <p className="text-xs font-medium text-foreground">
        Scanning your inbox — new results will appear here as they&apos;re found.
      </p>
    </div>
  );
}
