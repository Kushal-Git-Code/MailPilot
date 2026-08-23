import { extractEmailAddress } from "shared";
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
