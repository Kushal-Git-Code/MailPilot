import { extractEmailAddress, type DefaultCategory } from "shared";
import type { Classification } from "./classify.js";

// A remembered per-sender correction (US-3) always wins over the AI's own
// call for that sender — category/reason still come from the model, only
// priority is overridden, so category-based views stay useful.
export function applyCorrectionOverride(
  classification: Classification,
  from: string,
  senderRules: Map<string, boolean>
): Classification {
  const senderAddress = extractEmailAddress(from);
  const remembered = senderAddress ? senderRules.get(senderAddress) : undefined;

  if (remembered === undefined || remembered === classification.priority) {
    return classification;
  }

  return {
    ...classification,
    priority: remembered,
    reason: `Matches your earlier correction for this sender (marked ${remembered ? "priority" : "not priority"}).`,
  };
}

// Category's own remembered-correction override — kept separate from
// applyCorrectionOverride (priority) rather than merged into one function,
// since they're independently corrected (Step 30, Gap 2) and independently
// undoable; combining them would only make the reason-text logic messier
// for no real benefit.
export function applyCategoryOverride(
  classification: Classification,
  from: string,
  senderRules: Map<string, DefaultCategory>
): Classification {
  const senderAddress = extractEmailAddress(from);
  const remembered = senderAddress ? senderRules.get(senderAddress) : undefined;

  if (remembered === undefined || remembered === classification.category) {
    return classification;
  }

  return {
    ...classification,
    category: remembered,
    reason: `Matches your earlier category correction for this sender.`,
  };
}
