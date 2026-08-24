import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Soft-delete, matching the existing rules pattern elsewhere (corrections
// deactivate rather than hard-delete) — mail already classified under this
// category keeps its label untouched; only future classification stops
// considering it.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: rule, error: fetchError } = await supabase
    .from("rules")
    .select("id, user_id, rule_type")
    .eq("id", params.id)
    .single();
  if (fetchError || !rule || rule.user_id !== user.id || rule.rule_type !== "category_definition") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase.from("rules").update({ active: false }).eq("id", params.id);
  if (updateError) throw updateError;

  return NextResponse.json({ ok: true });
}
