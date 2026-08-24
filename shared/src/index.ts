// Placeholder — real shared types (e.g. classification schema) land here in Phase 5.
export interface Placeholder {
  id: string;
}

// Backlog classification job — /web enqueues it (Step 16), /worker will
// process it starting Phase 5. Keeping the shape here so both sides agree.
export const BACKLOG_QUEUE_NAME = "backlog-classification";

// Gap 1 (US-2's "within 2 minutes of arrival"): a separate queue whose only
// job is deciding *who* to check, on a recurring schedule — the actual
// classification work still runs entirely through BACKLOG_QUEUE_NAME's
// existing, already-tested pipeline. Kept separate so the scheduler's own
// tick job can never be confused with a per-user classification job.
export const POLL_QUEUE_NAME = "poll-scheduler";

export type BacklogDateRange = "7d" | "30d" | "forward";

export interface BacklogJobData {
  userId: string;
  dateRange: BacklogDateRange;
}

// Default classification categories per docs/prd-gmail-triage.md —
// user-customizable via the rules table starting Phase 7; this is the
// sensible default set. Shared so /web can validate a category correction
// against the exact same values /worker's classifier is allowed to output
// — never duplicated, never allowed to drift.
export const DEFAULT_CATEGORIES = [
  "Human",
  "Notification",
  "Newsletter",
  "Transactional",
  "Normal / Uncategorized",
] as const;

export type DefaultCategory = (typeof DEFAULT_CATEGORIES)[number];

// Gmail token encryption — shared between /web (encrypts on OAuth callback,
// decrypts to revoke) and /worker (decrypts to call the Gmail API). Kept
// here, not duplicated, so both sides can never drift out of sync.
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const CRYPTO_ALGORITHM = "aes-256-gcm";
const CRYPTO_IV_LENGTH = 12;
const CRYPTO_AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  const key = Buffer.from(hex, "hex");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes (64 hex chars)");
  return key;
}

/** Encrypts a string for storage. Never store Gmail tokens in plaintext. */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(CRYPTO_IV_LENGTH);
  const cipher = createCipheriv(CRYPTO_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decrypt(ciphertext: string): string {
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, CRYPTO_IV_LENGTH);
  const authTag = data.subarray(CRYPTO_IV_LENGTH, CRYPTO_IV_LENGTH + CRYPTO_AUTH_TAG_LENGTH);
  const encrypted = data.subarray(CRYPTO_IV_LENGTH + CRYPTO_AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(CRYPTO_ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export * from "./label.js";

// Pulls the bare address out of a Gmail "From" header (e.g. `Google Play
// <googleplay-noreply@google.com>` -> `googleplay-noreply@google.com`).
// Used only for the correction-signal rule match (CLAUDE.md's narrow,
// user-triggered exception to never storing sender) — never for anything
// else.
export function extractEmailAddress(fromHeader: string): string | null {
  const angleMatch = fromHeader.match(/<([^>]+)>/);
  if (angleMatch) return angleMatch[1].trim().toLowerCase();
  const trimmed = fromHeader.trim();
  return trimmed.includes("@") ? trimmed.toLowerCase() : null;
}
