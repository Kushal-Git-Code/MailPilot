"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const OPTIONS = [
  { value: "7d", label: "Last 7 days", sub: "Fastest first triage", icon: "clock" },
  { value: "30d", label: "Last 30 days", sub: "Recommended — a full picture", icon: "calendar" },
  { value: "forward", label: "From today forward only", sub: "Skip the backlog entirely", icon: "arrow" },
] as const;

function OptionIcon({ icon }: { icon: (typeof OPTIONS)[number]["icon"] }) {
  if (icon === "clock") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }
  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

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
        className="rounded-xl bg-success/10 px-4 py-3 text-sm text-text-secondary"
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
            className={`flex items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${
              isSelected ? "border-accent bg-accent/5 shadow-glow" : "border-border bg-surface"
            }`}
            style={{ perspective: 600 }}
            whileHover={{ y: -2, scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${
                isSelected ? "bg-gradient-to-br from-accent to-gold text-white" : "bg-surface-tint text-gold"
              }`}
            >
              <OptionIcon icon={option.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">{option.label}</span>
              <span className="block text-xs text-text-secondary">{option.sub}</span>
            </span>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? "border-accent bg-accent" : "border-border"
              }`}
            >
              {isSelected && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
          </motion.button>
        );
      })}

      {status === "error" && errorMessage && <p className="text-xs text-error">{errorMessage}</p>}

      <AnimatePresence>
        {selected && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={handleGetStarted}
            disabled={status === "loading"}
            className="mt-2 rounded-2xl bg-gradient-to-r from-accent to-gold px-6 py-3.5 font-display text-sm font-bold text-white shadow-glow disabled:opacity-60"
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
