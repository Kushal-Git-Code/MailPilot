import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuth2ClientForUser } from "@/lib/gmail";
import { applyPriorityLabel, removePriorityLabel } from "shared";

// US-5: reverses the most recent audit_log entry for this email, within
// its 30-day reversible_until window. Unlike a correction (Step 28), undo
// never creates or leaves behind a learned sender rule — a correction's
// rule is deactivated as part of reversing it, restoring exactly the
// state before that action, nothing more.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: emailRow } = await supabase
    .from("emails")
    .select("id, user_id, gmail_message_id, priority_flagged, category, user_corrected")
    .eq("id", params.id)
    .single();
  if (!emailRow || emailRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: lastEntry } = await supabase
    .from("audit_log")
    .select("id, action, previous_state, new_state, reversible_until")
    .eq("email_id", emailRow.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastEntry || new Date(lastEntry.reversible_until) < new Date()) {
    return NextResponse.json({ error: "Nothing to undo" }, { status: 409 });
  }

  // Category correction is a fully independent reversal path — never
  // touches Gmail (category is dashboard-only), never touches the
  // priority flag or its rule.
  if (lastEntry.action === "category_corrected") {
    const targetCategory = (lastEntry.previous_state as { category?: string | null } | null)?.category ?? null;
    const ruleId = (lastEntry.new_state as { ruleId?: string | null } | null)?.ruleId ?? null;

    // Reset user_corrected the same way the priority path below does —
    // it should mean "a correction is currently in effect," not "one was
    // ever made." (Same simplification as the priority path: doesn't
    // check whether the *other* dimension still has an active correction
    // — an existing, accepted limitation, not a new one introduced here.)
    const { error: updateError } = await supabase
      .from("emails")
      .update({ category: targetCategory, user_corrected: false })
      .eq("id", emailRow.id);
    if (updateError) throw updateError;

    if (ruleId) {
      await supabase.from("rules").update({ active: false }).eq("id", ruleId).eq("user_id", user.id);
    }

    await supabase.from("audit_log").insert({
      user_id: user.id,
      email_id: emailRow.id,
      action: "undone",
      previous_state: { category: emailRow.category },
      new_state: { category: targetCategory, undidActionId: lastEntry.id },
      reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
    });

    return NextResponse.json({ ok: true });
  }

  // Everything else reverses the priority flag (and, for a correction,
  // the sender rule it created) — the original Step 29 path, unchanged.
  let targetPriority: boolean;
  let ruleIdToDeactivate: string | null = null;
  let resetUserCorrected = false;

  if (lastEntry.action === "label_applied") {
    targetPriority = false;
  } else if (lastEntry.action === "label_removed") {
    targetPriority = true;
  } else if (lastEntry.action === "correction_made") {
    targetPriority = Boolean(lastEntry.previous_state?.priority_flagged);
    ruleIdToDeactivate = (lastEntry.new_state as { ruleId?: string | null } | null)?.ruleId ?? null;
    resetUserCorrected = true;
  } else {
    // e.g. "email_classified" (previous_state is null — nothing to
    // revert to) or a prior "undone" entry we don't recurse further into.
    return NextResponse.json({ error: "Nothing to undo" }, { status: 409 });
  }

  const oauth2Client = await getOAuth2ClientForUser(user.id);
  if (!oauth2Client) {
    return NextResponse.json({ error: "Gmail is not connected" }, { status: 409 });
  }

  if (targetPriority) {
    await applyPriorityLabel(supabase, oauth2Client, {
      userId: user.id,
      gmailMessageId: emailRow.gmail_message_id,
      emailId: emailRow.id,
    });
  } else {
    await removePriorityLabel(supabase, oauth2Client, {
      userId: user.id,
      gmailMessageId: emailRow.gmail_message_id,
      emailId: emailRow.id,
    });
  }

  const { error: updateError } = await supabase
    .from("emails")
    .update({
      priority_flagged: targetPriority,
      ...(resetUserCorrected ? { user_corrected: false } : {}),
    })
    .eq("id", emailRow.id);
  if (updateError) throw updateError;

  if (ruleIdToDeactivate) {
    await supabase.from("rules").update({ active: false }).eq("id", ruleIdToDeactivate).eq("user_id", user.id);
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    email_id: emailRow.id,
    action: "undone",
    previous_state: { priority_flagged: emailRow.priority_flagged },
    new_state: { priority_flagged: targetPriority, undidActionId: lastEntry.id },
    reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
  });

  return NextResponse.json({ ok: true });
}
