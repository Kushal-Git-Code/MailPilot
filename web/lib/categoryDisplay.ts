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
