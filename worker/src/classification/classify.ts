import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { DEFAULT_CATEGORIES } from "shared";
import type { FetchedMessage } from "../gmail/fetch.js";

export const ClassificationSchema = z.object({
  priority: z.boolean().describe("True if this email needs the user's direct attention/action."),
  category: z.enum(DEFAULT_CATEGORIES),
  reason: z
    .string()
    .describe("One short sentence explaining the classification — never a quote/excerpt of the email."),
  confidence: z.number().min(0).max(1).optional(),
});

export type Classification = z.infer<typeof ClassificationSchema>;

const SYSTEM_PROMPT = `You are MailPilot's email triage classifier. Given one email's subject, sender, and body, decide:

1. priority: true if EITHER of these is true:
   - It's a real question, request, or matter from a person genuinely expecting a reply or action, OR
   - It's an automated message with a real deadline or expiry the recipient could miss (e.g. a check-in window, an expiring verification code, a payment failure needing action, a limited-time account action) — automated does not mean low priority if there's a real clock on it.
   false for anything that can wait indefinitely or needs no action at all (routine confirmations, FYI-only messages, marketing, digests).
2. category — exactly one of:
   - "Human": a real message from a person expecting a reply or action
   - "Notification": automated account/security/app alerts, verification/OTP codes, calendar invites, survey or feedback requests — anything automated that isn't a purchase/billing/travel record
   - "Newsletter": subscribed content, digests, marketing
   - "Transactional": purchase receipts, order/shipping confirmations, invoices, travel booking confirmations
   - "Normal / Uncategorized": only for messages that genuinely don't fit any category above
3. reason: one short sentence explaining why — describe the situation, never quote or excerpt the email's actual content.
4. confidence: your confidence in this classification, 0 to 1.

Bias toward priority=true when genuinely uncertain — missing something urgent is worse than an extra flagged email.`;

const client = new Anthropic();

export async function classifyEmail(email: FetchedMessage): Promise<Classification> {
  const userContent = `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body || email.snippet}`;

  const response = await client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
    output_config: {
      format: zodOutputFormat(ClassificationSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error(`Claude did not return a parseable classification for message ${email.gmailMessageId}`);
  }

  return response.parsed_output;
}
