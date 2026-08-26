import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { DEFAULT_CATEGORIES } from "shared";
import type { FetchedMessage } from "../gmail/fetch.js";

// Step 32: a user's own custom categories (rules.rule_type: "category_definition").
// Structured output constrains Claude to literally only return one of the
// enum values baked into the schema at call time — there is no way to "just
// mention" an extra category in the prompt without it. So the schema/prompt
// must be built per-user, unioning the 5 defaults with whatever this
// specific user has defined. No custom categories → identical schema/prompt
// to before this existed, which is what keeps the /evals baseline valid.
export interface CustomCategory {
  name: string;
  description: string;
}

const BASE_SYSTEM_PROMPT = `You are MailPilot's email triage classifier. Given one email's subject, sender, and body, decide:

1. priority: true if EITHER of these is true:
   - It's a real question, request, or matter from a person genuinely expecting a reply or action, OR
   - It's an automated message with a real deadline, expiry, or consequence for waiting (e.g. a check-in window, a login/verification code needed to complete something the recipient is actively doing right now, a payment failure needing action before service is interrupted, a limited-time account action) — automated does not mean low priority if there's a real clock on it or a real cost to delay.
   false for anything that can wait indefinitely or needs no action at all. This includes routine "confirm your email" / "verify your account to finish setup" messages that have no stated expiry and no real cost to waiting — the recipient can act on these anytime without losing anything, unlike a login code (needed right now to get in) or a deadline-bound notice (a real cost if missed). Also false for FYI-only messages, marketing, and digests.
2. category — exactly one of:
   - "Human": a real message from a person expecting a reply or action
   - "Notification": automated account/security/app alerts, verification/OTP codes, calendar invites, survey or feedback requests — anything automated that isn't a purchase/billing/travel record
   - "Newsletter": subscribed content, digests, marketing
   - "Transactional": purchase receipts, order/shipping confirmations, invoices, and ANY travel-related automated message — booking confirmations, check-in reminders, boarding passes, itinerary/gate changes. If it relates to a trip you booked, it's Transactional, never Notification, even if it's phrased as a reminder/alert.
   - "Normal / Uncategorized": only for messages that genuinely don't fit any category above`;

const BASE_SYSTEM_PROMPT_TAIL = `3. reason: one short sentence explaining why — describe the situation, never quote or excerpt the email's actual content.
4. confidence: your confidence in this classification, 0 to 1.

Bias toward priority=true when genuinely uncertain — missing something urgent is worse than an extra flagged email.`;

function buildSchemaAndPrompt(customCategories: CustomCategory[]) {
  if (customCategories.length === 0) {
    return {
      schema: z.object({
        priority: z.boolean().describe("True if this email needs the user's direct attention/action."),
        category: z.enum(DEFAULT_CATEGORIES),
        reason: z
          .string()
          .describe("One short sentence explaining the classification — never a quote/excerpt of the email."),
        confidence: z.number().min(0).max(1).optional(),
      }),
      systemPrompt: `${BASE_SYSTEM_PROMPT}\n${BASE_SYSTEM_PROMPT_TAIL}`,
    };
  }

  // z.enum requires a non-empty tuple of string literals, not a plain
  // string[] — spread into a tuple so TypeScript accepts the dynamic union.
  const allCategoryNames = [...DEFAULT_CATEGORIES, ...customCategories.map((c) => c.name)] as [
    string,
    ...string[],
  ];
  const customCategoryLines = customCategories
    .map((c) => `   - "${c.name}": ${c.description}`)
    .join("\n");

  return {
    schema: z.object({
      priority: z.boolean().describe("True if this email needs the user's direct attention/action."),
      category: z.enum(allCategoryNames),
      reason: z
        .string()
        .describe("One short sentence explaining the classification — never a quote/excerpt of the email."),
      confidence: z.number().min(0).max(1).optional(),
    }),
    systemPrompt: `${BASE_SYSTEM_PROMPT}\n\nThis user has also defined their own categories — prefer one of these over a default when the email genuinely matches it better:\n${customCategoryLines}\n${BASE_SYSTEM_PROMPT_TAIL}`,
  };
}

export type Classification = {
  priority: boolean;
  category: string;
  reason: string;
  confidence?: number;
};

const client = new Anthropic();

export async function classifyEmail(
  email: FetchedMessage,
  customCategories: CustomCategory[] = []
): Promise<Classification> {
  const userContent = `Subject: ${email.subject}\nFrom: ${email.from}\n\n${email.body || email.snippet}`;
  const { schema, systemPrompt } = buildSchemaAndPrompt(customCategories);

  const response = await client.messages.parse({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
    output_config: {
      format: zodOutputFormat(schema),
    },
  });

  if (!response.parsed_output) {
    throw new Error(`Claude did not return a parseable classification for message ${email.gmailMessageId}`);
  }

  return response.parsed_output;
}
