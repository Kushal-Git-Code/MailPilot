import Link from "next/link";
import { GLANCE_CATEGORY_VALUES, CATEGORY_DISPLAY_NAMES, type CategoryValue } from "@/lib/categoryDisplay";

// Same color language as CATEGORY_BADGE_CLASSES (lib/categoryDisplay.ts) --
// reused rather than reinvented, so a category's color means the same thing
// here as it does on every badge elsewhere in the app.
const CATEGORY_ICON_CLASSES: Record<CategoryValue, string> = {
  Human: "bg-success/15 text-success",
  Notification: "bg-sky/15 text-sky",
  Newsletter: "bg-gold/20 text-gold",
  Transactional: "bg-rose/15 text-rose",
  "Normal / Uncategorized": "bg-surface-tint text-text-secondary",
};

// One line per row on what to actually do with it, not just what it is --
// design-review takeaway from comparing against Tame's category view (each
// of their rows carries an action caption, e.g. "Only you can handle
// these" / "Read or archive").
const CATEGORY_SUBTITLES: Record<CategoryValue, string> = {
  Human: "Real people, nothing urgent",
  Notification: "Security & account alerts",
  Newsletter: "Read when you have time",
  Transactional: "Receipts, shipping, orders",
  "Normal / Uncategorized": "",
};
const NEEDS_YOU_SUBTITLE = "Only you can handle these";

const CATEGORY_ICONS: Record<CategoryValue, JSX.Element> = {
  Human: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  ),
  Notification: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6" />
      <path d="M10.5 21a1.5 1.5 0 0 0 3 0" />
    </svg>
  ),
  Newsletter: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h13v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
      <path d="M17 8h3v10a2 2 0 0 1-2 2h-1" />
      <path d="M8 8h5M8 12h5M8 16h3" />
    </svg>
  ),
  Transactional: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 14h4" />
    </svg>
  ),
  "Normal / Uncategorized": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
};
const NEEDS_YOU_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a5.5 5.5 0 0 0-3 10.1V16a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3.9A5.5 5.5 0 0 0 9.5 2Z" />
    <path d="M9 22h1" />
  </svg>
);

function senderLine(names: string[], total: number): string | null {
  if (names.length === 0) return null;
  const remaining = total - names.length;
  return `From: ${names.join(", ")}${remaining > 0 ? `, +${remaining} more` : ""}`;
}

export function GlanceTiles({
  needsYouCount,
  needsYouSenderPreview,
  categoryCounts,
  categorySenderPreviews,
}: {
  needsYouCount: number;
  needsYouSenderPreview: string[];
  categoryCounts: Record<CategoryValue, number>;
  categorySenderPreviews: Record<string, string[]>;
}) {
  return (
    <div className="mb-6 flex flex-col gap-2.5">
      <Link
        href={{ pathname: "/dashboard/all", query: { filter: "Needs You" } }}
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-accent to-accent-hover p-4 text-white shadow-glow transition-transform hover:-translate-y-0.5"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <div className="h-[18px] w-[18px]">{NEEDS_YOU_ICON}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold leading-tight">Needs You</p>
          <p className="text-xs opacity-90">{NEEDS_YOU_SUBTITLE}</p>
          {senderLine(needsYouSenderPreview, needsYouCount) && (
            <p className="mt-0.5 truncate text-[11px] italic opacity-75">
              {senderLine(needsYouSenderPreview, needsYouCount)}
            </p>
          )}
        </div>
        <span className="font-display shrink-0 text-2xl font-extrabold leading-none">{needsYouCount}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {GLANCE_CATEGORY_VALUES.map((value) => {
        const count = categoryCounts[value] ?? 0;
        const preview = senderLine(categorySenderPreviews[value] ?? [], count);
        const label = CATEGORY_DISPLAY_NAMES[value];
        return (
          <Link
            key={value}
            href={{ pathname: "/dashboard/all", query: { filter: label } }}
            className="group flex items-center gap-4 rounded-2xl bg-surface p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-transform hover:-translate-y-0.5"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${CATEGORY_ICON_CLASSES[value]}`}>
              <div className="h-[18px] w-[18px]">{CATEGORY_ICONS[value]}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold leading-tight text-foreground">{label}</p>
              <p className="text-xs text-text-secondary">{CATEGORY_SUBTITLES[value]}</p>
              {preview && <p className="mt-0.5 truncate text-[11px] italic text-text-secondary opacity-80">{preview}</p>}
            </div>
            <span className="font-display shrink-0 text-2xl font-extrabold leading-none text-foreground">{count}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
