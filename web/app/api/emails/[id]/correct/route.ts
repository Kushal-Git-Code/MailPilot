import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuth2ClientForUser } from "@/lib/gmail";
import { getEmailDisplayInfo } from "@/lib/gmailDisplay";
import { applyPriorityLabel, removePriorityLabel, extractEmailAddress } from "shared";

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
  if (typeof correctedPriority !== "boolean") {
    return NextResponse.json({ error: "priority must be a boolean" }, { status: 400 });
  }

  const { data: emailRow } = await supabase
    .from("emails")
    .select("id, user_id, gmail_message_id, priority_flagged")
    .eq("id", params.id)
    .single();
  if (!emailRow || emailRow.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (emailRow.priority_flagged === correctedPriority) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const oauth2Client = await getOAuth2ClientForUser(user.id);
  if (!oauth2Client) {
    return NextResponse.json({ error: "Gmail is not connected" }, { status: 409 });
  }

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

  await supabase.from("audit_log").insert({
    user_id: user.id,
    email_id: emailRow.id,
    action: "correction_made",
    previous_state: { priority_flagged: emailRow.priority_flagged },
    new_state: { priority_flagged: correctedPriority },
    reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
  });

  // Remember this sender's preference going forward (US-3) — the one
  // narrow, user-triggered exception to never storing sender, per
  // CLAUDE.md. Live-fetched only now, only because this is an explicit
  // correction, never cached beyond this one write.
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const displayMap = await getEmailDisplayInfo(gmail, [emailRow.gmail_message_id]);
  const senderAddress = extractEmailAddress(displayMap.get(emailRow.gmail_message_id)?.from ?? "");

  if (senderAddress) {
    await supabase
      .from("rules")
      .update({ active: false })
      .eq("user_id", user.id)
      .eq("rule_type", "correction_signal")
      .contains("rule_data", { sender: senderAddress });

    await supabase.from("rules").insert({
      user_id: user.id,
      rule_type: "correction_signal",
      rule_data: { sender: senderAddress, priority: correctedPriority },
      active: true,
    });
  }

  return NextResponse.json({ ok: true });
}
