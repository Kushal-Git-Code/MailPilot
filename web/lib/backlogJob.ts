import type { SupabaseClient } from "@supabase/supabase-js";

export async function hasActiveBacklogJob(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("backlog_jobs")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "processing")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
