"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_VALUES, CATEGORY_DISPLAY_NAMES } from "@/lib/categoryDisplay";

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

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCategory = e.target.value;
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

  return (
    <select
      value={currentCategory ?? ""}
      onChange={handleChange}
      disabled={loading}
      onClick={(e) => e.stopPropagation()}
      className="shrink-0 rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50"
    >
      {CATEGORY_VALUES.map((value) => (
        <option key={value} value={value}>
          {CATEGORY_DISPLAY_NAMES[value]}
        </option>
      ))}
      {customCategories.map((name) => (
        // A custom category's display name is whatever the user typed —
        // no separate mapping needed, unlike the defaults above.
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}
