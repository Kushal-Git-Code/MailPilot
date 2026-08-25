"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_VALUES, CATEGORY_DISPLAY_NAMES, CATEGORY_BADGE_CLASSES, type CategoryValue } from "@/lib/categoryDisplay";

function isKnownCategory(value: string): value is CategoryValue {
  return value in CATEGORY_DISPLAY_NAMES;
}

// A native <select> can't be styled once it's open (real browser chrome
// takes over) — flagged directly during design review as looking "weird"
// next to the rest of the app's rounded, colorful pills. This is the same
// custom open/close/select pattern already used for the backlog range
// picker, applied here.
export function CategoryCorrectionSelect({
  emailId,
  currentCategory,
  customCategories,
}: {
  emailId: string;
  currentCategory: string | null;
  customCategories: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleSelect(newCategory: string) {
    setOpen(false);
    if (newCategory === currentCategory) return;
    setLoading(true);
    const res = await fetch(`/api/emails/${emailId}/correct`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: newCategory }),
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  const currentLabel = currentCategory
    ? isKnownCategory(currentCategory)
      ? CATEGORY_DISPLAY_NAMES[currentCategory]
      : currentCategory
    : "Uncategorized";

  return (
    <div ref={rootRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50"
      >
        {loading ? "..." : currentLabel}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-2.5 w-2.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 max-h-64 w-48 overflow-y-auto rounded-xl border border-border bg-surface py-1.5 shadow-glow">
          {CATEGORY_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-background"
            >
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CATEGORY_BADGE_CLASSES[value]}`}>
                {CATEGORY_DISPLAY_NAMES[value]}
              </span>
              {value === currentCategory && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0 text-accent">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
          {customCategories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleSelect(name)}
              className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-background"
            >
              <span className="rounded-md border border-dashed border-violet px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet">
                {name}
              </span>
              {name === currentCategory && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 shrink-0 text-accent">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
