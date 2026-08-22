"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const OPTIONS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "forward", label: "From today forward only" },
] as const;

export function BacklogForm() {
  const [selected, setSelected] = useState<(typeof OPTIONS)[number]["value"] | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-success/10 px-4 py-3 text-sm text-text-secondary"
      >
        Range saved — backlog processing hookup lands in the next step (Step 16).
      </motion.p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {OPTIONS.map((option) => {
        const isSelected = selected === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => setSelected(option.value)}
            className={`rounded-xl border-2 px-5 py-3.5 text-left text-sm font-medium transition-colors ${
              isSelected
                ? "border-accent bg-accent/5 text-foreground shadow-glow"
                : "border-border bg-surface text-foreground"
            }`}
            style={{ perspective: 600 }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {option.label}
          </motion.button>
        );
      })}

      <AnimatePresence>
        {selected && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={() => setConfirmed(true)}
            className="mt-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3 text-sm font-semibold text-white shadow-glow"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Get Started
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
