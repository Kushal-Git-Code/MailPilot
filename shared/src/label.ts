import { google } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";

// The one and only Gmail label MailPilot ever applies. Never anything else,
// never touching the user's existing labels/filters — per CLAUDE.md. Shared
// between /worker (initial classification) and /web (manual corrections) so
// both sides can never drift out of sync on this logic.
const PRIORITY_LABEL_NAME = "MailPilot/Priority";

async function getOrCreatePriorityLabelId(gmail: ReturnType<typeof google.gmail>): Promise<string> {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = data.labels?.find((l) => l.name === PRIORITY_LABEL_NAME);
  if (existing?.id) return existing.id;

  try {
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
  } catch (err) {
    // On a brand-new account with no label yet, concurrent calls (batched
    // classification, or a correction landing at the same time) can race
    // to create it — only one Gmail API call wins, the rest get a name
    // conflict. Self-heal by re-fetching rather than failing the whole
    // batch; a real, unrelated error still propagates.
    const status = (err as { code?: number; response?: { status?: number } })?.response?.status;
    if (status !== 409 && status !== 400) throw err;

    const { data: retryData } = await gmail.users.labels.list({ userId: "me" });
    const nowExists = retryData.labels?.find((l) => l.name === PRIORITY_LABEL_NAME);
    if (!nowExists?.id) throw err;
    return nowExists.id;
  }
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

export async function removePriorityLabel(
  supabase: SupabaseClient,
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  params: { userId: string; gmailMessageId: string; emailId?: string | null }
): Promise<{ removed: boolean; wasLabeled: boolean }> {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  const labelId = await getOrCreatePriorityLabelId(gmail);

  const { data: message } = await gmail.users.messages.get({
    userId: "me",
    id: params.gmailMessageId,
    format: "minimal",
  });
  const currentLabelIds = message.labelIds ?? [];

  if (!currentLabelIds.includes(labelId)) {
    return { removed: false, wasLabeled: false };
  }

  const { error: auditError } = await supabase.from("audit_log").insert({
    user_id: params.userId,
    email_id: params.emailId ?? null,
    action: "label_removed",
    previous_state: { labelIds: currentLabelIds },
    new_state: { labelIds: currentLabelIds.filter((id) => id !== labelId) },
    reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
  });
  if (auditError) throw auditError;

  // Only ever remove our own label — never anything else the user has.
  await gmail.users.messages.modify({
    userId: "me",
    id: params.gmailMessageId,
    requestBody: { removeLabelIds: [labelId] },
  });

  return { removed: true, wasLabeled: true };
}
