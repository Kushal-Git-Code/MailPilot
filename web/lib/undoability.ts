import type { SupabaseClient } from "@supabase/supabase-js";

// One batched query per page load (not one per email) — same principle as
// the earlier speed fixes. An email is "undoable" if its most recent
// audit_log entry is still within its reversible_until window and is an
// action with a real prior state to revert to (not the initial
// "email_classified" entry, which has no previous_state).
const UNDOABLE_ACTIONS = new Set([
  "label_applied",
  "label_removed",
  "correction_made",
  "category_corrected",
  "undone",
]);

export async function getUndoableEmailIds(
  supabase: SupabaseClient,
  userId: string,
  emailIds: string[]
): Promise<Set<string>> {
  if (emailIds.length === 0) return new Set();

  const { data, error } = await supabase
    .from("audit_log")
    .select("email_id, action, created_at, reversible_until")
    .eq("user_id", userId)
    .in("email_id", emailIds)
    .gt("reversible_until", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;

  const latestSeenFor = new Set<string>();
  const undoable = new Set<string>();

  for (const row of data ?? []) {
    if (latestSeenFor.has(row.email_id)) continue; // already resolved this email's latest entry
    latestSeenFor.add(row.email_id);
    if (UNDOABLE_ACTIONS.has(row.action)) {
      undoable.add(row.email_id);
    }
  }

  return undoable;
}
