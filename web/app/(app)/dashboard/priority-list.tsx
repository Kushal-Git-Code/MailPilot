"use client";

import { motion } from "framer-motion";
import { CorrectionButton } from "./correction-button";
import { UndoButton } from "./undo-button";
import { initialsFrom, avatarColorFor, displayNameFromHeader } from "@/lib/avatarColor";
import { CATEGORY_DISPLAY_NAMES, CATEGORY_BADGE_CLASSES, type CategoryValue } from "@/lib/categoryDisplay";

export interface PriorityListItem {
  id: string;
  gmailThreadId: string;
  from: string;
  subject: string;
  reason: string;
  receivedAt: string;
  category: string | null;
  undoable: boolean;
}

function isKnownCategory(value: string | null): value is CategoryValue {
  return value !== null && value in CATEGORY_DISPLAY_NAMES;
}

export function PriorityList({ items }: { items: PriorityListItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => {
        const name = displayNameFromHeader(item.from);
        // Only the single most-urgent item (the top of the list, which is
        // already sorted most-recent-first — a reasonable proxy for "most
        // needs you right now") gets the glow ring. Everywhere else it would
        // just be noise, not a signal — the whole point of it (Phase 8
        // design review, section 04).
        const isTopItem = i === 0;
        const badgeClass = isKnownCategory(item.category)
          ? CATEGORY_BADGE_CLASSES[item.category]
          : "bg-surface-tint text-text-secondary";
        const badgeLabel = isKnownCategory(item.category) ? CATEGORY_DISPLAY_NAMES[item.category] : item.category;

        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.04 }}
            className={isTopItem ? "relative rounded-[22px] p-[3px]" : ""}
          >
            {isTopItem && (
              <div
                className="absolute inset-0 -z-10 animate-[spin_6s_linear_infinite] rounded-[22px] opacity-70 blur-[10px]"
                style={{
                  background:
                    "conic-gradient(from 0deg, #FF6B6B, #D9A056, #7C6BFF, #4D96FF, #FF6B6B)",
                }}
                aria-hidden="true"
              />
            )}
            <div className="relative rounded-2xl border border-border bg-surface p-4 shadow-glow transition-transform hover:-translate-y-0.5">
              <a
                href={`https://mail.google.com/mail/u/0/#all/${item.gmailThreadId}`}
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
                    {badgeLabel && (
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-text-secondary">
                      {new Date(item.receivedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-foreground">{item.subject}</p>
                  {item.reason && <p className="mt-1 text-xs text-text-secondary">{item.reason}</p>}
                </div>
              </a>
              <div className="mt-3 flex items-center justify-end gap-2">
                {item.undoable && <UndoButton emailId={item.id} />}
                <CorrectionButton emailId={item.id} currentPriority={true} />
                <a
                  href={`https://mail.google.com/mail/u/0/#all/${item.gmailThreadId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full bg-gradient-to-r from-accent to-secondary px-3.5 py-1.5 text-[11px] font-bold text-white shadow-glow transition-transform hover:-translate-y-0.5 active:scale-95"
                >
                  Open in Gmail
                </a>
              </div>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}
