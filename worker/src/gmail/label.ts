import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";

// The one and only Gmail label MailPilot ever applies. Never anything else,
// never touching the user's existing labels/filters — per CLAUDE.md.
const PRIORITY_LABEL_NAME = "MailPilot/Priority";

async function getOrCreatePriorityLabelId(gmail: ReturnType<typeof google.gmail>): Promise<string> {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = data.labels?.find((l) => l.name === PRIORITY_LABEL_NAME);
  if (existing?.id) return existing.id;

  const { data: created } = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: PRIORITY_LABEL_NAME,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  if (!created.id) throw new Error("Gmail did not return an id for the newly created label");
  return created.id;
}

export async function applyPriorityLabel(
  supabase: SupabaseClient,
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  params: { userId: string; gmailMessageId: string; emailId?: string | null }
): Promise<{ applied: boolean; alreadyLabeled: boolean }> {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const labelId = await getOrCreatePriorityLabelId(gmail);

  // Idempotency: check current label state before writing anything —
  // label writes aren't idempotent by default (per CLAUDE.md gotchas).
  const { data: message } = await gmail.users.messages.get({
    userId: "me",
    id: params.gmailMessageId,
    format: "minimal",
  });
  const currentLabelIds = message.labelIds ?? [];

  if (currentLabelIds.includes(labelId)) {
    return { applied: false, alreadyLabeled: true };
  }

  // Log to audit_log before the Gmail write, per the hard rule in CLAUDE.md.
  const { error: auditError } = await supabase.from("audit_log").insert({
    user_id: params.userId,
    email_id: params.emailId ?? null,
    action: "label_applied",
    previous_state: { labelIds: currentLabelIds },
    new_state: { labelIds: [...currentLabelIds, labelId] },
    reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
  });
  if (auditError) throw auditError;

  // Only ever add our one label — never removeLabelIds for anything else.
  await gmail.users.messages.modify({
    userId: "me",
    id: params.gmailMessageId,
    requestBody: { addLabelIds: [labelId] },
  });

  return { applied: true, alreadyLabeled: false };
}
