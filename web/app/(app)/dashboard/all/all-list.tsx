"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CorrectionButton } from "../correction-button";
import { UndoButton } from "../undo-button";
import { CategoryCorrectionSelect } from "../category-correction-select";
import { initialsFrom, avatarColorFor, displayNameFromHeader } from "@/lib/avatarColor";

export interface AllEmailsItem {
  id: string;
  gmailThreadId: string;
  from: string;
  subject: string;
  reason: string;
  receivedAt: string;
  category: string | null;
  priorityFlagged: boolean;
  undoable: boolean;
}

// Was a fixed union of the 5 defaults — now a plain string, since Step 32's
// custom categories are real, per-user, dynamic filter/badge values too, not
// just the fixed set the AI originally shipped with.
type FilterOption = string;

const DEFAULT_FILTER_OPTIONS = ["All", "Needs Your Attention", "Primary", "Alerts", "Newsletters", "Transactional", "Other"];
const DEFAULT_INTERNAL_CATEGORIES = ["Human", "Notification", "Newsletter", "Transactional"];

// Same color language as the dashboard's glance rows and PriorityList's
// badges (CATEGORY_BADGE_CLASSES, lib/categoryDisplay.ts) — this page was
// the one place still showing every bucket in flat grey, which is most of
// why it read as "dull" next to the rest of the app.
const FILTER_ACTIVE_CLASSES: Record<string, string> = {
  All: "bg-foreground text-white",
  "Needs Your Attention": "bg-gradient-to-r from-accent to-accent-hover text-white",
  Primary: "bg-success text-white",
  Alerts: "bg-sky text-white",
  Newsletters: "bg-gold text-white",
  Transactional: "bg-rose text-white",
  Other: "bg-text-secondary text-white",
};
const FILTER_ACTIVE_FALLBACK = "bg-violet text-white"; // custom categories

const BUCKET_BADGE_CLASSES: Record<string, string> = {
  All: "bg-surface-tint text-text-secondary",
  "Needs Your Attention": "bg-accent/10 text-accent-hover",
  Primary: "bg-success/10 text-success",
  Alerts: "bg-sky/10 text-sky",
  Newsletters: "bg-gold/15 text-gold",
  Transactional: "bg-rose/10 text-rose",
  Other: "bg-surface-tint text-text-secondary",
};
const BUCKET_BADGE_FALLBACK = "border border-dashed border-violet text-violet"; // custom categories

// Filter pills reuse the exact same tint language as the badges above (same
// map) so a color always means the same thing everywhere on this page --
// they just also get a fully solid version for whichever one is active.

function getDisplayBucket(item: AllEmailsItem, activeFilter: FilterOption): string {
  // Under a specific tab, the badge must say why the item is in *that*
  // list (matching what you filtered for) — not a fixed priority-first
  // label that can contradict the tab you're looking at. Only "All" falls
  // back to the priority-first label, since there's no single tab to match.
  if (activeFilter !== "All") return activeFilter;
  if (item.priorityFlagged) return "Needs Your Attention";
  switch (item.category) {
    case "Human":
      return "Primary";
    case "Notification":
      return "Alerts";
    case "Newsletter":
      return "Newsletters";
    case "Transactional":
      return "Transactional";
    default:
      // A custom category's internal name and display name are the same
      // (the user typed it themselves) — anything left over that isn't a
      // known default falls back to "Other", same as always.
      return item.category ?? "Other";
  }
}

function matchesFilter(item: AllEmailsItem, filter: FilterOption): boolean {
  switch (filter) {
    case "All":
      return true;
    case "Needs Your Attention":
      return item.priorityFlagged;
    case "Primary":
      return item.category === "Human";
    case "Alerts":
      return item.category === "Notification";
    case "Newsletters":
      return item.category === "Newsletter";
    case "Transactional":
      return item.category === "Transactional";
    case "Other":
      return !DEFAULT_INTERNAL_CATEGORIES.includes(item.category ?? "");
    default:
      // A custom category filter — match by the exact category name.
      return item.category === filter;
  }
}

// A hardcoded /u/0/ in a Gmail deep link opens whichever Google account
// happens to be the browser's first-signed-in one, not necessarily the
// connected account -- silently landing on that account's inbox instead of
// the thread when they're not the same. Confirmed live: keeping /u/0/ in
// the path *alongside* an authuser= query param still opened the wrong
// account -- Google's routing honors the path segment over the query
// string, so the two must never both be present. Dropping /u/0/ entirely
// and resolving purely via authuser=<email> is the fix.
function gmailThreadUrl(threadId: string, gmailAddress: string | null): string {
  const auth = gmailAddress ? `?authuser=${encodeURIComponent(gmailAddress)}` : "";
  return `https://mail.google.com/mail/${auth}#all/${threadId}`;
}

export function AllEmailsList({
  items,
  customCategories,
  initialFilter,
  gmailAddress,
}: {
  items: AllEmailsItem[];
  customCategories: string[];
  initialFilter?: string;
  gmailAddress: string | null;
}) {
  const filterOptions = useMemo(
    () => [...DEFAULT_FILTER_OPTIONS, ...customCategories],
    [customCategories]
  );
  // Counts every pill against data already loaded for filtering -- no new
  // fetch, just a second pass over `items` per option.
  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const option of filterOptions) {
      counts[option] = items.filter((item) => matchesFilter(item, option)).length;
    }
    return counts;
  }, [items, filterOptions]);
  // Validated against the known set rather than trusted outright — this
  // comes from a URL query param (a dashboard row link), which is user-
  // editable and shouldn't be able to select a filter that doesn't exist.
  const [filter, setFilter] = useState<FilterOption>(() =>
    initialFilter && [...DEFAULT_FILTER_OPTIONS, ...customCategories].includes(initialFilter)
      ? initialFilter
      : "All"
  );
  const filtered = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [items, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = filter === option;
          const activeClass = FILTER_ACTIVE_CLASSES[option] ?? FILTER_ACTIVE_FALLBACK;
          const tintClass = BUCKET_BADGE_CLASSES[option] ?? BUCKET_BADGE_FALLBACK;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-0.5 ${
                isActive ? `${activeClass} shadow-glow` : tintClass
              }`}
            >
              {option} <span className="opacity-70">({filterCounts[option] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center shadow-glow">
          <p className="text-sm text-text-secondary">Nothing here yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((item, i) => {
            const name = displayNameFromHeader(item.from);
            const bucket = getDisplayBucket(item, filter);
            const badgeClass = BUCKET_BADGE_CLASSES[bucket] ?? BUCKET_BADGE_FALLBACK;

            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.03 }}
              >
                <div className="rounded-xl border border-border bg-surface p-5 shadow-glow transition-transform hover:-translate-y-0.5">
                  <a
                    href={gmailThreadUrl(item.gmailThreadId, gmailAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-3"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColorFor(name)}`}
                      aria-hidden="true"
                    >
                      {initialsFrom(name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-foreground">{name}</p>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}
                        >
                          {bucket}
                        </span>
                        <span className="ml-auto shrink-0 text-xs text-text-secondary">
                          {new Date(item.receivedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-semibold text-foreground">{item.subject}</p>
                      {item.reason && <p className="mt-1 truncate text-xs text-text-secondary">{item.reason}</p>}
                    </div>
                  </a>
                  <div className="mt-3 flex items-center justify-end gap-3">
                    {item.undoable && <UndoButton emailId={item.id} />}
                    <CategoryCorrectionSelect
                      emailId={item.id}
                      currentCategory={item.category}
                      customCategories={customCategories}
                    />
                    <CorrectionButton emailId={item.id} currentPriority={item.priorityFlagged} />
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
