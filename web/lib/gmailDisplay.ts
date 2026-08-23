import type { gmail_v1 } from "googleapis";

export interface DisplayInfo {
  subject: string;
  from: string;
}

// In-memory, per-process cache — deliberately never Redis/Postgres/disk.
// This is the finalized performance strategy from docs/trd.md: sender/
// subject are never persisted, only fetched live and cached in server RAM
// for the life of this process. Don't "upgrade" this without approval.
const cache = new Map<string, DisplayInfo>();
const CONCURRENCY = 20;
const MAX_RETRIES = 3;

// Gmail API rate limits are a hard constraint (per CLAUDE.md) — same
// backoff pattern as worker/src/gmail/fetch.ts, not a naive retry loop.
async function withBackoff<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { code?: number; response?: { status?: number } })?.response?.status;
      const isRateLimited = status === 429 || status === 403;
      if (!isRateLimited || attempt >= MAX_RETRIES) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
}

export async function getEmailDisplayInfo(
  gmail: gmail_v1.Gmail,
  messageIds: string[]
): Promise<Map<string, DisplayInfo>> {
  const result = new Map<string, DisplayInfo>();
  const uncached: string[] = [];

  for (const id of messageIds) {
    const cached = cache.get(id);
    if (cached) {
      result.set(id, cached);
    } else {
      uncached.push(id);
    }
  }

  // Batched — one round of concurrent requests, not one-call-per-email.
  for (let i = 0; i < uncached.length; i += CONCURRENCY) {
    const batch = uncached.slice(i, i + CONCURRENCY);
    const fetched = await Promise.all(
      batch.map((id) =>
        withBackoff(() =>
          gmail.users.messages.get({
            userId: "me",
            id,
            format: "metadata",
            metadataHeaders: ["Subject", "From"],
          })
        )
      )
    );
    for (const { data } of fetched) {
      const headers = data.payload?.headers ?? [];
      const info: DisplayInfo = {
        subject: headers.find((h) => h.name === "Subject")?.value ?? "(no subject)",
        from: headers.find((h) => h.name === "From")?.value ?? "(unknown sender)",
      };
      cache.set(data.id!, info);
      result.set(data.id!, info);
    }
  }

  return result;
}
