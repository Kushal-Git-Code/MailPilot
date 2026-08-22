import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBacklogQueue } from "@/lib/queue";
import type { BacklogDateRange } from "shared";

const VALID_RANGES: BacklogDateRange[] = ["7d", "30d", "forward"];

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const dateRange = body?.dateRange as BacklogDateRange | undefined;
  if (!dateRange || !VALID_RANGES.includes(dateRange)) {
    return NextResponse.json({ error: "Invalid dateRange" }, { status: 400 });
  }

  const { data: tokenRow } = await supabase
    .from("gmail_tokens")
    .select("status")
    .eq("user_id", user.id)
    .single();
  if (!tokenRow || tokenRow.status !== "active") {
    return NextResponse.json({ error: "Gmail is not connected" }, { status: 409 });
  }

  const job = await getBacklogQueue().add("scan", { userId: user.id, dateRange });

  return NextResponse.json({ jobId: job.id });
}
