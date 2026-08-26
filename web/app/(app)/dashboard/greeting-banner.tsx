"use client";

import { useEffect, useState } from "react";
import type { LatestSession } from "@/lib/triageSession";

function timeOfDayGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function relativeTimeFrom(iso: string, now: Date): string {
  const minutes = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// Greeting depends on the viewer's own clock, not the server's -- computed
// after mount instead of at render time, so someone in a different timezone
// doesn't see "Good morning" at 9pm their time. Placeholder text keeps the
// layout stable until that first client render lands.
export function GreetingBanner({
  firstName,
  session,
}: {
  firstName: string;
  session: LatestSession | null;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const greeting = now ? timeOfDayGreeting(now.getHours()) : " ";

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">
          {greeting}
          {firstName ? `, ${firstName}.` : "."}
        </h1>
        {session && now && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            Last checked {relativeTimeFrom(session.completedAt, now)}
          </span>
        )}
      </div>

      {/* First-person, not a stat report -- design review takeaway from
          Quell's copy: proving MailPilot actively did something ("I went
          through... I've already filed...") is a different job from
          restating the same counts the rows below already show, and a
          rows-only page can't do it no matter how the numbers are
          formatted. */}
      {session && (
        <p className="mt-2 max-w-prose text-sm text-text-secondary">
          I went through{" "}
          <strong className="font-semibold text-foreground">
            {session.processedCount} new email{session.processedCount === 1 ? "" : "s"}
          </strong>{" "}
          while you were away
          {session.priorityCount > 0 ? (
            <>
              {" — "}
              <strong className="font-semibold text-foreground">
                {session.priorityCount} need{session.priorityCount === 1 ? "s" : ""} you
              </strong>
              , the rest I&apos;ve already filed and out of your way.
            </>
          ) : (
            ", and none of it needs you — you're all caught up."
          )}
        </p>
      )}
    </div>
  );
}
