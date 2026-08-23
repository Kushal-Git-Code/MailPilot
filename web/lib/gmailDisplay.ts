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
const CONCURRENCY = 10;

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
        gmail.users.messages.get({
          userId: "me",
          id,
          format: "metadata",
          metadataHeaders: ["Subject", "From"],
        })
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
