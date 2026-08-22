import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { FetchedMessage } from "../gmail/fetch.js";

// Default categories per docs/prd-gmail-triage.md — user-customizable via
// the rules table starting Phase 7; this is just the sensible default set.
export const DEFAULT_CATEGORIES = [
  "Human",
  "Notification",
  "Newsletter",
  "Transactional",
  "Normal / Uncategorized",
] as const;

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

1. priority: true only if this email genuinely needs the recipient's direct attention or action soon (a real question, request, or time-sensitive matter from a person or service). false for anything that can wait or needs no action.
2. category — exactly one of:
   - "Human": a real message from a person expecting a reply or action
   - "Notification": automated alerts (security, account, app notifications)
   - "Newsletter": subscribed content, digests, marketing
   - "Transactional": receipts, order/shipping confirmations, invoices
   - "Normal / Uncategorized": anything that doesn't cleanly fit above
3. reason: one short sentence explaining why — describe the situation, never quote or excerpt the email's actual content.
4. confidence: your confidence in this classification, 0 to 1.

Bias toward priority=true when genuinely uncertain whether a human message needs a response — missing something urgent is worse than an extra flagged email.`;

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
