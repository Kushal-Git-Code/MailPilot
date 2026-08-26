import type { SupabaseClient } from "@supabase/supabase-js";
import type { gmail_v1 } from "googleapis";
import { getEmailDisplayInfo } from "./gmailDisplay";
import { displayNameFromHeader } from "./avatarColor";
import type { CategoryValue } from "./categoryDisplay";

const SAMPLES_PER_CATEGORY = 3;

// Powers the "From: Google, Supabase, +3 more" line under each glance tile
// -- sender names are fetched live from Gmail per render, same
// zero-content-storage pattern as everywhere else display info is shown
// (gmailDisplay.ts), never persisted. Only a handful of message ids per
// category are sampled, not the whole category, to keep this cheap.
export async function getCategorySenderPreviews(
  supabase: SupabaseClient,
  gmail: gmail_v1.Gmail,
  userId: string,
  categories: readonly CategoryValue[]
): Promise<Record<string, string[]>> {
  const perCategoryIds = await Promise.all(
    categories.map(async (value) => {
      // Excludes priority-flagged emails, same exclusive-bucket rule as the
      // count query in dashboard/page.tsx -- a priority-flagged email's
      // sender should only ever show up under Needs Your Attention.
      const { data } = await supabase
        .from("emails")
        .select("gmail_message_id")
        .eq("user_id", userId)
        .eq("category", value)
        .eq("priority_flagged", false)
        .order("received_at", { ascending: false })
        .limit(SAMPLES_PER_CATEGORY);
      return [value, (data ?? []).map((row) => row.gmail_message_id as string)] as const;
    })
  );

  const allIds = perCategoryIds.flatMap(([, ids]) => ids);
  const displayMap = allIds.length > 0 ? await getEmailDisplayInfo(gmail, allIds) : new Map();

  const result: Record<string, string[]> = {};
  for (const [value, ids] of perCategoryIds) {
    result[value] = ids.map((id) => {
      const info = displayMap.get(id);
      return info ? displayNameFromHeader(info.from) : "Unknown sender";
    });
  }
  return result;
}
