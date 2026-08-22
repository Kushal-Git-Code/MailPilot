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
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGetStarted() {
    if (!selected) return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/onboarding/backlog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateRange: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }
      setStatus("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg bg-success/10 px-4 py-3 text-sm text-text-secondary"
      >
        Range saved — your backlog scan job has been queued.
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

      {status === "error" && errorMessage && (
        <p className="text-xs text-error">{errorMessage}</p>
      )}

      <AnimatePresence>
        {selected && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={handleGetStarted}
            disabled={status === "loading"}
            className="mt-2 rounded-xl bg-gradient-to-r from-accent to-accent-hover px-6 py-3 text-sm font-semibold text-white shadow-glow disabled:opacity-60"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {status === "loading" ? "Starting..." : "Get Started"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
