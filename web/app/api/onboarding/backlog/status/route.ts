import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data } = await supabase
    .from("backlog_jobs")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "processing")
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ active: !!data });
}
