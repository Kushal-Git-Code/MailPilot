import Link from "next/link";

// Exactly four rows, matching Tame's real structure -- not four action rows
// PLUS four category rows (that was a real mistake, caught by the user:
// adding new rows on top of the old ones doubled the count instead of
// replacing it, which defeats the entire "scan it in two seconds" point).
// Primary/Alerts/Newsletters/Transactional no longer get their own rows
// here -- they collapse into FYI Only. They're still available as filter
// tabs on /dashboard/all for browsing/correcting, just not surfaced as
// separate dashboard rows anymore.
const DEADLINE_SUBTITLE = "Miss these and there's a real cost";
const QUICK_REPLY_SUBTITLE = "A one-line answer closes these out";
const NEEDS_ATTENTION_SUBTITLE = "These are waiting on you";
const FYI_SUBTITLE = "Already sorted -- read or skip whenever";

const DEADLINE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5" />
    <path d="M9 2h6" />
  </svg>
);
const QUICK_REPLY_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />
  </svg>
);
const NEEDS_ATTENTION_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a5.5 5.5 0 0 0-3 10.1V16a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2v-3.9A5.5 5.5 0 0 0 9.5 2Z" />
    <path d="M9 22h1" />
  </svg>
);
const FYI_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

interface RowStyle {
  link: string;
  icon: string;
  title: string;
  subtitle: string;
  senders: string;
  count: string;
}

// The three priority rows share the coral family deliberately -- color
// means "something in your priority mail needs a decision from you,"
// distinguished from each other by icon/label/position, not hue. FYI Only
// gets the neutral treatment (same language as "Other"/"All" elsewhere),
// since it's explicitly the calm, no-action-needed bucket.
const PRIORITY_ROW_STYLE: RowStyle = {
  link: "group relative flex items-center gap-4 rounded-2xl bg-accent/10 p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-accent hover:to-accent-hover hover:shadow-glow focus-visible:-translate-y-0.5 focus-visible:bg-gradient-to-r focus-visible:from-accent focus-visible:to-accent-hover focus-visible:shadow-glow focus-visible:outline-none",
  icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent-hover transition-colors group-hover:bg-white/25 group-hover:text-white group-focus-visible:bg-white/25 group-focus-visible:text-white",
  title: "font-display text-[15px] font-bold leading-tight text-accent-hover transition-colors group-hover:text-white group-focus-visible:text-white",
  subtitle: "mt-0.5 text-[12.5px] font-medium text-[#3c4a68] transition-colors group-hover:text-white group-focus-visible:text-white",
  senders: "mt-1 truncate text-[11.5px] font-semibold text-text-secondary transition-colors group-hover:text-white/90 group-focus-visible:text-white/90",
  count: "font-display shrink-0 text-xl font-extrabold leading-none text-accent-hover transition-colors group-hover:text-white group-focus-visible:text-white",
};

const FYI_ROW_STYLE: RowStyle = {
  link: "group relative flex items-center gap-4 rounded-2xl bg-surface-tint p-4 shadow-[0_4px_14px_rgba(27,42,74,0.06)] transition-all hover:-translate-y-0.5",
  icon: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-text-secondary",
  title: "font-display text-[15px] font-bold leading-tight text-text-secondary",
  subtitle: "mt-0.5 text-[12.5px] font-medium text-[#3c4a68]",
  senders: "mt-1 truncate text-[11.5px] font-semibold text-text-secondary",
  count: "font-display shrink-0 text-xl font-extrabold leading-none text-text-secondary",
};

const CHEVRON_CLASS =
  "h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-white group-focus-visible:translate-x-0.5 group-focus-visible:text-white";

function senderLine(names: string[], total: number): string | null {
  if (names.length === 0) return null;
  const remaining = total - names.length;
  return `From: ${names.join(", ")}${remaining > 0 ? `, +${remaining} more` : ""}`;
}

function GlanceRow({
  style,
  filter,
  icon,
  title,
  subtitle,
  count,
  senderPreview,
}: {
  style: RowStyle;
  filter: string;
  icon: JSX.Element;
  title: string;
  subtitle: string;
  count: number;
  senderPreview: string[];
}) {
  const preview = senderLine(senderPreview, count);
  return (
    <Link href={{ pathname: "/dashboard/all", query: { filter } }} className={style.link}>
      <div className={style.icon}>
        <div className="h-[18px] w-[18px]">{icon}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className={style.title}>{title}</p>
        <p className={style.subtitle}>{subtitle}</p>
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
}

export function GlanceTiles({
  deadlineCount,
  deadlineSenderPreview,
  quickReplyCount,
  quickReplySenderPreview,
  needsAttentionCount,
  needsAttentionSenderPreview,
  fyiCount,
  fyiSenderPreview,
}: {
  deadlineCount: number;
  deadlineSenderPreview: string[];
  quickReplyCount: number;
  quickReplySenderPreview: string[];
  needsAttentionCount: number;
  needsAttentionSenderPreview: string[];
  fyiCount: number;
  fyiSenderPreview: string[];
}) {
  return (
    <div className="mb-6 flex flex-col gap-2.5">
      <GlanceRow
        style={PRIORITY_ROW_STYLE}
        filter="Has Deadlines"
        icon={DEADLINE_ICON}
        title="Has Deadlines"
        subtitle={DEADLINE_SUBTITLE}
        count={deadlineCount}
        senderPreview={deadlineSenderPreview}
      />
      <GlanceRow
        style={PRIORITY_ROW_STYLE}
        filter="Quick Replies"
        icon={QUICK_REPLY_ICON}
        title="Quick Replies"
        subtitle={QUICK_REPLY_SUBTITLE}
        count={quickReplyCount}
        senderPreview={quickReplySenderPreview}
      />
      <GlanceRow
        style={PRIORITY_ROW_STYLE}
        filter="Needs Your Attention"
        icon={NEEDS_ATTENTION_ICON}
        title="Needs Your Attention"
        subtitle={NEEDS_ATTENTION_SUBTITLE}
        count={needsAttentionCount}
        senderPreview={needsAttentionSenderPreview}
      />
      <GlanceRow
        style={FYI_ROW_STYLE}
        filter="FYI Only"
        icon={FYI_ICON}
        title="FYI Only"
        subtitle={FYI_SUBTITLE}
        count={fyiCount}
        senderPreview={fyiSenderPreview}
      />
    </div>
  );
}
