"use client";

import { motion } from "framer-motion";
import { CorrectionButton } from "./correction-button";
import { UndoButton } from "./undo-button";

export interface PriorityListItem {
  id: string;
  gmailThreadId: string;
  from: string;
  subject: string;
  reason: string;
  receivedAt: string;
  undoable: boolean;
}

export function PriorityList({ items }: { items: PriorityListItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22, delay: i * 0.04 }}
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
              <p className="mt-2 text-xs text-text-secondary">{item.reason}</p>
            </a>
            <div className="mt-3 flex items-center justify-end gap-3">
              {item.undoable && <UndoButton emailId={item.id} />}
              <CorrectionButton emailId={item.id} currentPriority={true} />
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
