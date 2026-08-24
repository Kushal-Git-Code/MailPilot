"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./dashboard/logout-button";
import { initialsFrom, avatarColorFor } from "@/lib/avatarColor";

interface NavLinkItem {
  label: string;
  href: string;
  matchPrefix: string;
}

// Only Inbox and Settings are real, routable sections in v1 — everything
// else is visible-but-muted "Coming soon", per docs/app-flow.md's nav spec.
// Not links: clicking a "Coming soon" item should do nothing, not 404.
const LINKS: NavLinkItem[] = [
  { label: "Inbox", href: "/dashboard", matchPrefix: "/dashboard" },
  { label: "Settings", href: "/settings/account", matchPrefix: "/settings" },
];
const COMING_SOON = ["Commitments", "Unsubscribe"];

interface SidebarContentsProps {
  displayName: string;
  email: string;
  onNavigate?: () => void;
}

function SidebarContents({ displayName, email, onNavigate }: SidebarContentsProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pb-4 pt-6">
        <span className="font-display text-lg font-bold text-foreground">MailPilot</span>
      </div>

      {displayName && (
        <div className="mx-3 mb-4 flex items-center gap-2.5 rounded-xl bg-surface-tint px-3 py-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColorFor(displayName)}`}
          >
            {initialsFrom(displayName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            {email && email !== displayName && (
              <p className="truncate text-xs text-text-secondary">{email}</p>
            )}
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gradient-to-r from-accent to-secondary text-white shadow-glow"
                  : "text-text-secondary hover:bg-surface-tint hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        {COMING_SOON.map((label) => (
          <div
            key={label}
            aria-disabled="true"
            className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-text-secondary opacity-45"
          >
            <span>{label}</span>
            <span className="rounded-full bg-surface-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              Soon
            </span>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-4">
        <LogoutButton />
      </div>
    </div>
  );
}

export function Sidebar({ displayName, email }: { displayName: string; email: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: persistent sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
        <SidebarContents displayName={displayName} email={email} />
      </aside>

      {/* Mobile: hamburger toggle + slide-in drawer */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="font-display text-lg font-bold text-foreground">MailPilot</span>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="rounded-lg border border-border p-2 text-text-secondary"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M3 5h14M3 10h14M3 15h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface shadow-glow">
            <SidebarContents displayName={displayName} email={email} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
