import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuth2ClientForUser } from "@/lib/gmail";
import { getEmailDisplayInfo } from "@/lib/gmailDisplay";
import { applyPriorityLabel, removePriorityLabel, extractEmailAddress, DEFAULT_CATEGORIES } from "shared";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const correctedPriority = body?.priority;
  const correctedCategory = body?.category;

  const hasPriority = correctedPriority !== undefined;
  const hasCategory = correctedCategory !== undefined;

  if (!hasPriority && !hasCategory) {
    return NextResponse.json({ error: "Must provide priority and/or category" }, { status: 400 });
  }
  if (hasPriority && typeof correctedPriority !== "boolean") {
    return NextResponse.json({ error: "priority must be a boolean" }, { status: 400 });
  }
  if (hasCategory) {
    // Valid targets are the 5 defaults plus this user's own active custom
    // categories (Step 32) — without this, the correction dropdown could
    // offer a custom category the server would then reject.
    const { data: customCategoryRules } = await supabase
      .from("rules")
      .select("rule_data")
      .eq("user_id", user.id)
      .eq("rule_type", "category_definition")
      .eq("active", true);
    const customCategoryNames = (customCategoryRules ?? [])
      .map((row) => (row.rule_data as { name?: string }).name)
      .filter((name): name is string => Boolean(name));

    const validCategories: readonly string[] = [...DEFAULT_CATEGORIES, ...customCategoryNames];
    if (!validCategories.includes(correctedCategory)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }

  const { data: emailRow } = await supabase
    .from("emails")
    .select("id, user_id, gmail_message_id, priority_flagged, category")
    .eq("id", params.id)
    .single();
  if (!emailRow || emailRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const oauth2Client = await getOAuth2ClientForUser(user.id);
  if (!oauth2Client) {
    return NextResponse.json({ error: "Gmail is not connected" }, { status: 409 });
  }

  // Priority correction — unchanged from Step 28. Applies/removes the real
  // Gmail label, since priority is the one thing that ever touches Gmail.
  if (hasPriority && emailRow.priority_flagged !== correctedPriority) {
    if (correctedPriority) {
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
      .update({ priority_flagged: correctedPriority, user_corrected: true })
      .eq("id", emailRow.id);
    if (updateError) throw updateError;

    // Remember this sender's priority preference going forward (US-3) —
    // the one narrow, user-triggered exception to never storing sender,
    // per CLAUDE.md. Live-fetched only now, only because this is an
    // explicit correction, never cached beyond this one write.
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const displayMap = await getEmailDisplayInfo(gmail, [emailRow.gmail_message_id]);
    const senderAddress = extractEmailAddress(displayMap.get(emailRow.gmail_message_id)?.from ?? "");

    let ruleId: string | null = null;
    if (senderAddress) {
      await supabase
        .from("rules")
        .update({ active: false })
        .eq("user_id", user.id)
        .eq("rule_type", "correction_signal")
        .contains("rule_data", { sender: senderAddress });

      const { data: newRule } = await supabase
        .from("rules")
        .insert({
          user_id: user.id,
          rule_type: "correction_signal",
          rule_data: { sender: senderAddress, priority: correctedPriority },
          active: true,
        })
        .select("id")
        .single();
      ruleId = newRule?.id ?? null;
    }

    // ruleId travels with this audit entry so undo (Step 29) can
    // deactivate the exact rule this correction created, not just flip
    // the flag back.
    await supabase.from("audit_log").insert({
      user_id: user.id,
      email_id: emailRow.id,
      action: "correction_made",
      previous_state: { priority_flagged: emailRow.priority_flagged },
      new_state: { priority_flagged: correctedPriority, ruleId },
      reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
    });
  }

  // Category correction (Step 30, Gap 2) — a fully independent action from
  // priority. Never touches Gmail at all: category is dashboard-only, per
  // CLAUDE.md's hard rule that only the single Priority label is ever
  // applied. Its own rule_type keeps it from ever clobbering a priority
  // rule for the same sender, and its own audit action keeps undo precise.
  if (hasCategory && emailRow.category !== correctedCategory) {
    const { error: updateError } = await supabase
      .from("emails")
      .update({ category: correctedCategory, user_corrected: true })
      .eq("id", emailRow.id);
    if (updateError) throw updateError;

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const displayMap = await getEmailDisplayInfo(gmail, [emailRow.gmail_message_id]);
    const senderAddress = extractEmailAddress(displayMap.get(emailRow.gmail_message_id)?.from ?? "");

    let ruleId: string | null = null;
    if (senderAddress) {
      await supabase
        .from("rules")
        .update({ active: false })
        .eq("user_id", user.id)
        .eq("rule_type", "category_correction_signal")
        .contains("rule_data", { sender: senderAddress });

      const { data: newRule } = await supabase
        .from("rules")
        .insert({
          user_id: user.id,
          rule_type: "category_correction_signal",
          rule_data: { sender: senderAddress, category: correctedCategory },
          active: true,
        })
        .select("id")
        .single();
      ruleId = newRule?.id ?? null;
    }

    await supabase.from("audit_log").insert({
      user_id: user.id,
      email_id: emailRow.id,
      action: "category_corrected",
      previous_state: { category: emailRow.category },
      new_state: { category: correctedCategory, ruleId },
      reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
    });
  }

  return NextResponse.json({ ok: true });
}
