import type { SupabaseClient } from "@supabase/supabase-js";

export interface LatestSession {
  processedCount: number;
  priorityCount: number;
  completedAt: string;
}

export async function getLatestSession(supabase: SupabaseClient, userId: string): Promise<LatestSession | null> {
  const { data, error } = await supabase
    .from("triage_sessions")
    .select("processed_count, priority_count, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    processedCount: data.processed_count,
    priorityCount: data.priority_count,
    completedAt: data.completed_at,
  };
}
