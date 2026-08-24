import type { SupabaseClient } from "@supabase/supabase-js";
import { DAILY_CAP } from "shared";

const RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

// Rolling 24h window (not calendar-day-aligned) — simpler, and matches how
// most per-day rate limits actually behave.
export async function getRemainingDailyCapacity(
  supabase: SupabaseClient,
  userId: string
): Promise<{ remaining: number; resetAt: string }> {
  const { data: user, error } = await supabase
    .from("users")
    .select("daily_email_count, daily_count_reset_at")
    .eq("id", userId)
    .single();
  if (error || !user) throw new Error(`Could not load daily cap state for user ${userId}`);

  const resetAtMs = new Date(user.daily_count_reset_at).getTime();
  const now = Date.now();

  if (now - resetAtMs >= RESET_WINDOW_MS) {
    const newResetAt = new Date().toISOString();
    await supabase
      .from("users")
      .update({ daily_email_count: 0, daily_count_reset_at: newResetAt })
      .eq("id", userId);
    return { remaining: DAILY_CAP, resetAt: newResetAt };
  }

  return {
    remaining: Math.max(0, DAILY_CAP - user.daily_email_count),
    resetAt: user.daily_count_reset_at,
  };
}

export async function incrementDailyCount(
  supabase: SupabaseClient,
  userId: string,
  by: number
): Promise<void> {
  if (by <= 0) return;
  const { data: user, error } = await supabase
    .from("users")
    .select("daily_email_count")
    .eq("id", userId)
    .single();
  if (error || !user) throw new Error(`Could not load daily count for user ${userId}`);

  const { error: updateError } = await supabase
    .from("users")
    .update({ daily_email_count: user.daily_email_count + by })
    .eq("id", userId);
  if (updateError) throw updateError;
}

export function msUntilNextReset(resetAtIso: string): number {
  const nextReset = new Date(resetAtIso).getTime() + RESET_WINDOW_MS;
  return Math.max(0, nextReset - Date.now());
}
