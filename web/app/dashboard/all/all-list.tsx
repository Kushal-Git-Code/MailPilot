"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CorrectionButton } from "../correction-button";

export interface AllEmailsItem {
  id: string;
  gmailThreadId: string;
  from: string;
  subject: string;
  reason: string;
  receivedAt: string;
  category: string | null;
  priorityFlagged: boolean;
}

type FilterOption = "All" | "Needs You" | "Primary" | "Alerts" | "Newsletters" | "Transactional" | "Other";

const FILTER_OPTIONS: FilterOption[] = ["All", "Needs You", "Primary", "Alerts", "Newsletters", "Transactional", "Other"];

function getDisplayBucket(item: AllEmailsItem, activeFilter: FilterOption): Exclude<FilterOption, "All"> {
  // Under a specific tab, the badge must say why the item is in *that*
  // list (matching what you filtered for) — not a fixed priority-first
  // label that can contradict the tab you're looking at. Only "All" falls
  // back to the priority-first label, since there's no single tab to match.
  if (activeFilter !== "All") return activeFilter;
  if (item.priorityFlagged) return "Needs You";
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
      return "Other";
  }
}

function matchesFilter(item: AllEmailsItem, filter: FilterOption): boolean {
  switch (filter) {
    case "All":
      return true;
    case "Needs You":
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
      return !["Human", "Notification", "Newsletter", "Transactional"].includes(item.category ?? "");
  }
}

export function AllEmailsList({ items }: { items: AllEmailsItem[] }) {
  const [filter, setFilter] = useState<FilterOption>("All");
  const filtered = useMemo(() => items.filter((item) => matchesFilter(item, filter)), [items, filter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setFilter(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === option ? "bg-accent text-white" : "bg-surface text-text-secondary hover:bg-background"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-surface p-10 text-center shadow-glow">
          <p className="text-sm text-text-secondary">Nothing here yet.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.03 }}
            >
              <div className="rounded-xl border border-border bg-surface p-5 shadow-glow transition-transform hover:-translate-y-0.5">
                <a
                  href={`https://mail.google.com/mail/u/0/#all/${item.gmailThreadId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="truncate text-sm font-semibold text-foreground">{item.from}</p>
                    <p className="shrink-0 text-xs text-text-secondary">
                      {new Date(item.receivedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-sm text-foreground">{item.subject}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                      {getDisplayBucket(item, filter)}
                    </span>
                    {item.reason && <p className="truncate text-xs text-text-secondary">{item.reason}</p>}
                  </div>
                </a>
                <div className="mt-3 flex justify-end">
                  <CorrectionButton emailId={item.id} currentPriority={item.priorityFlagged} />
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
