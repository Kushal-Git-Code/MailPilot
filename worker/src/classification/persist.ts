import type { SupabaseClient } from "@supabase/supabase-js";
import type { Classification } from "./classify.js";

export async function persistClassification(
  supabase: SupabaseClient,
  params: {
    userId: string;
    gmailMessageId: string;
    gmailThreadId: string;
    receivedAt: string;
    classification: Classification;
  }
): Promise<{ emailId: string }> {
  // Upsert on (user_id, gmail_message_id) — a BullMQ job retry must not
  // create duplicate rows for the same email (PRD edge case).
  const { data: emailRow, error: emailError } = await supabase
    .from("emails")
    .upsert(
      {
        user_id: params.userId,
        gmail_message_id: params.gmailMessageId,
        gmail_thread_id: params.gmailThreadId,
        priority_flagged: params.classification.priority,
        category: params.classification.category,
        has_deadline: params.classification.hasDeadline,
        quick_reply_candidate: params.classification.quickReplyCandidate,
        classification_reason: params.classification.reason,
        confidence: params.classification.confidence ?? null,
        processed_at: new Date().toISOString(),
        received_at: params.receivedAt,
      },
      { onConflict: "user_id,gmail_message_id" }
    )
    .select("id")
    .single();
  if (emailError) throw emailError;

  const { error: auditError } = await supabase.from("audit_log").insert({
    user_id: params.userId,
    email_id: emailRow.id,
    action: "email_classified",
    previous_state: null,
    new_state: {
      priority_flagged: params.classification.priority,
      category: params.classification.category,
    },
    reversible_until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
  });
  if (auditError) throw auditError;

  return { emailId: emailRow.id };
}
