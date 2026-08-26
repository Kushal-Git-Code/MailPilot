import Link from "next/link";
import { GLANCE_CATEGORY_VALUES, CATEGORY_DISPLAY_NAMES, type CategoryValue } from "@/lib/categoryDisplay";

// One line per row on what to actually do with it, not just what it is --
// design-review takeaway from comparing against Tame's category view. The
// Needs Your Attention subtitle was originally "Only you can handle these"
// (too close to a direct lift from Tame's own copy) -- replaced with
// original wording after a design discussion.
const CATEGORY_SUBTITLES: Record<CategoryValue, string> = {
  Human: "Real people, nothing urgent",
  Notification: "Security & account alerts",
  Newsletter: "Read when you have time",
  Transactional: "Receipts, shipping, orders",
  "Normal / Uncategorized": "",
};
const NEEDS_ATTENTION_SUBTITLE = "These are waiting on you";

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
const NEEDS_ATTENTION_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a5.5 5.5 0 0 0-3 10.1V16a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3.9A5.5 5.5 0 0 0 9.5 2Z" />
    <path d="M9 22h1" />
  </svg>
);

// Every row rests as a soft tint of its own color and only shows its full
// solid color while you're hovering or keyboard-focused on it -- no row is
// permanently solid by default the way "Needs You" used to always be red.
// Tailwind needs each variant as a literal string (no dynamic
// hover:from-${x} interpolation), so this is a lookup of whole class
// strings per row, not a formula.
interface RowStyle {
  link: string;
  icon: string;
  title: string;
  subtitle: string;
  senders: string;
  count: string;
}

const NEEDS_ATTENTION_STYLE: RowStyle = {
  link: "group relative flex items-center gap-4 rounded-2xl bg-accent/10 p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-accent hover:to-accent-hover hover:shadow-glow focus-visible:-translate-y-0.5 focus-visible:bg-gradient-to-r focus-visible:from-accent focus-visible:to-accent-hover focus-visible:shadow-glow focus-visible:outline-none",
  icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-hover transition-colors group-hover:bg-white/25 group-hover:text-white group-focus-visible:bg-white/25 group-focus-visible:text-white",
  title: "font-display text-[15px] font-bold leading-tight text-accent-hover transition-colors group-hover:text-white group-focus-visible:text-white",
  subtitle: "mt-0.5 text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-white group-focus-visible:text-white",
  senders: "mt-1 truncate text-xs text-text-secondary transition-colors group-hover:text-white/90 group-focus-visible:text-white/90",
  count: "font-display shrink-0 text-xl font-extrabold leading-none text-accent-hover transition-colors group-hover:text-white group-focus-visible:text-white",
};

const CATEGORY_STYLES: Record<CategoryValue, RowStyle> = {
  Human: {
    link: "group relative flex items-center gap-4 rounded-2xl bg-success/10 p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-success hover:to-[#22935a] hover:shadow-[0_6px_16px_-6px_rgba(47,174,102,0.5)] focus-visible:-translate-y-0.5 focus-visible:bg-gradient-to-r focus-visible:from-success focus-visible:to-[#22935a] focus-visible:shadow-[0_6px_16px_-6px_rgba(47,174,102,0.5)] focus-visible:outline-none",
    icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/20 text-success transition-colors group-hover:bg-white/25 group-hover:text-white group-focus-visible:bg-white/25 group-focus-visible:text-white",
    title: "font-display text-[15px] font-bold leading-tight text-success transition-colors group-hover:text-white group-focus-visible:text-white",
    subtitle: "mt-0.5 text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-white group-focus-visible:text-white",
    senders: "mt-1 truncate text-xs text-text-secondary transition-colors group-hover:text-white/90 group-focus-visible:text-white/90",
    count: "font-display shrink-0 text-xl font-extrabold leading-none text-success transition-colors group-hover:text-white group-focus-visible:text-white",
  },
  Notification: {
    link: "group relative flex items-center gap-4 rounded-2xl bg-sky/10 p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-sky hover:to-[#3b7fe0] hover:shadow-[0_6px_16px_-6px_rgba(77,150,255,0.5)] focus-visible:-translate-y-0.5 focus-visible:bg-gradient-to-r focus-visible:from-sky focus-visible:to-[#3b7fe0] focus-visible:shadow-[0_6px_16px_-6px_rgba(77,150,255,0.5)] focus-visible:outline-none",
    icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky/20 text-sky transition-colors group-hover:bg-white/25 group-hover:text-white group-focus-visible:bg-white/25 group-focus-visible:text-white",
    title: "font-display text-[15px] font-bold leading-tight text-sky transition-colors group-hover:text-white group-focus-visible:text-white",
    subtitle: "mt-0.5 text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-white group-focus-visible:text-white",
    senders: "mt-1 truncate text-xs text-text-secondary transition-colors group-hover:text-white/90 group-focus-visible:text-white/90",
    count: "font-display shrink-0 text-xl font-extrabold leading-none text-sky transition-colors group-hover:text-white group-focus-visible:text-white",
  },
  Newsletter: {
    link: "group relative flex items-center gap-4 rounded-2xl bg-gold/15 p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-gold hover:to-[#c08d45] hover:shadow-[0_6px_16px_-6px_rgba(217,160,86,0.5)] focus-visible:-translate-y-0.5 focus-visible:bg-gradient-to-r focus-visible:from-gold focus-visible:to-[#c08d45] focus-visible:shadow-[0_6px_16px_-6px_rgba(217,160,86,0.5)] focus-visible:outline-none",
    icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/25 text-gold transition-colors group-hover:bg-white/25 group-hover:text-white group-focus-visible:bg-white/25 group-focus-visible:text-white",
    title: "font-display text-[15px] font-bold leading-tight text-gold transition-colors group-hover:text-white group-focus-visible:text-white",
    subtitle: "mt-0.5 text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-white group-focus-visible:text-white",
    senders: "mt-1 truncate text-xs text-text-secondary transition-colors group-hover:text-white/90 group-focus-visible:text-white/90",
    count: "font-display shrink-0 text-xl font-extrabold leading-none text-gold transition-colors group-hover:text-white group-focus-visible:text-white",
  },
  Transactional: {
    link: "group relative flex items-center gap-4 rounded-2xl bg-rose/10 p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-rose hover:to-[#c04672] hover:shadow-[0_6px_16px_-6px_rgba(217,87,138,0.5)] focus-visible:-translate-y-0.5 focus-visible:bg-gradient-to-r focus-visible:from-rose focus-visible:to-[#c04672] focus-visible:shadow-[0_6px_16px_-6px_rgba(217,87,138,0.5)] focus-visible:outline-none",
    icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose/20 text-rose transition-colors group-hover:bg-white/25 group-hover:text-white group-focus-visible:bg-white/25 group-focus-visible:text-white",
    title: "font-display text-[15px] font-bold leading-tight text-rose transition-colors group-hover:text-white group-focus-visible:text-white",
    subtitle: "mt-0.5 text-[13.5px] font-semibold text-foreground transition-colors group-hover:text-white group-focus-visible:text-white",
    senders: "mt-1 truncate text-xs text-text-secondary transition-colors group-hover:text-white/90 group-focus-visible:text-white/90",
    count: "font-display shrink-0 text-xl font-extrabold leading-none text-rose transition-colors group-hover:text-white group-focus-visible:text-white",
  },
  "Normal / Uncategorized": {
    link: "group relative flex items-center gap-4 rounded-2xl bg-surface-tint p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5",
    icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary",
    title: "font-display text-[15px] font-bold leading-tight text-text-secondary",
    subtitle: "mt-0.5 text-[13.5px] font-semibold text-foreground",
    senders: "mt-1 truncate text-xs text-text-secondary",
    count: "font-display shrink-0 text-xl font-extrabold leading-none text-text-secondary",
  },
};

const CHEVRON_CLASS =
  "h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-white group-focus-visible:translate-x-0.5 group-focus-visible:text-white";

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
  const needsAttentionPreview = senderLine(needsYouSenderPreview, needsYouCount);

  return (
    <div className="mb-6 flex flex-col gap-2.5">
      <Link
        href={{ pathname: "/dashboard/all", query: { filter: "Needs Your Attention" } }}
        className={NEEDS_ATTENTION_STYLE.link}
      >
        <div className={NEEDS_ATTENTION_STYLE.icon}>
          <div className="h-[18px] w-[18px]">{NEEDS_ATTENTION_ICON}</div>
        </div>
        <div className="min-w-0 flex-1">
          <p className={NEEDS_ATTENTION_STYLE.title}>Needs Your Attention</p>
          <p className={NEEDS_ATTENTION_STYLE.subtitle}>{NEEDS_ATTENTION_SUBTITLE}</p>
          {needsAttentionPreview && <p className={NEEDS_ATTENTION_STYLE.senders}>{needsAttentionPreview}</p>}
        </div>
        <span className={NEEDS_ATTENTION_STYLE.count}>{needsYouCount}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={CHEVRON_CLASS}
          aria-hidden="true"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {GLANCE_CATEGORY_VALUES.map((value) => {
        const count = categoryCounts[value] ?? 0;
        const preview = senderLine(categorySenderPreviews[value] ?? [], count);
        const label = CATEGORY_DISPLAY_NAMES[value];
        const style = CATEGORY_STYLES[value];
        return (
          <Link key={value} href={{ pathname: "/dashboard/all", query: { filter: label } }} className={style.link}>
            <div className={style.icon}>
              <div className="h-[18px] w-[18px]">{CATEGORY_ICONS[value]}</div>
            </div>
            <div className="min-w-0 flex-1">
              <p className={style.title}>{label}</p>
              <p className={style.subtitle}>{CATEGORY_SUBTITLES[value]}</p>
              {preview && <p className={style.senders}>{preview}</p>}
            </div>
            <span className={style.count}>{count}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={CHEVRON_CLASS}
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
