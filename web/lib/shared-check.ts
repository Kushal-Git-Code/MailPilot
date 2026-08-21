// Verifies /web can import types from /shared. Real usage lands once
// dashboard/API code needs the classification schema (Phase 5+).
import type { Placeholder } from "shared";

export const sharedTypeCheck: Placeholder = { id: "shared-import-ok" };
