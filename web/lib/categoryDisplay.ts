// Client-safe: deliberately does NOT import from "shared" — that package's
// barrel file also re-exports server-only code (googleapis, node:crypto)
// which would bloat/break the browser bundle if pulled into a client
// component. Keep these literal values in sync with shared's
// DEFAULT_CATEGORIES and the worker's classification Zod enum if the
// category set ever changes.
export const CATEGORY_VALUES = [
  "Human",
  "Notification",
  "Newsletter",
  "Transactional",
  "Normal / Uncategorized",
] as const;

export type CategoryValue = (typeof CATEGORY_VALUES)[number];

export const CATEGORY_DISPLAY_NAMES: Record<CategoryValue, string> = {
  Human: "Primary",
  Notification: "Alerts",
  Newsletter: "Newsletters",
  Transactional: "Transactional",
  "Normal / Uncategorized": "Other",
};

// Reasoned, not decorative (Phase 8 design review): green for Primary (real
// people, nothing urgent — "this is fine"), gold for Newsletters (warm,
// curated-content feel), sky for Alerts (the standard automated/info
// convention), rose for Transactional (deliberately far from green so it's
// never mistaken for Primary), neutral for Other (the genuine catch-all).
// A custom category (Step 32) isn't in this map — it gets the dashed-violet
// treatment inline wherever it's rendered, since its color can't be a fixed
// mapping the way the 5 defaults are.
export const CATEGORY_BADGE_CLASSES: Record<CategoryValue, string> = {
  Human: "bg-success/10 text-success",
  Notification: "bg-sky/10 text-sky",
  Newsletter: "bg-gold/15 text-gold",
  Transactional: "bg-rose/10 text-rose",
  "Normal / Uncategorized": "bg-surface-tint text-text-secondary",
};
