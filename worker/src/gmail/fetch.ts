import { google } from "googleapis";
import type { BacklogDateRange } from "shared";

export interface FetchedMessage {
  gmailMessageId: string;
  gmailThreadId: string;
  subject: string;
  from: string;
  receivedAt: string;
  snippet: string;
}

const CONCURRENCY = 10;
const MAX_RETRIES = 3;

function dateRangeToQuery(dateRange: BacklogDateRange): string | null {
  if (dateRange === "forward") return null; // no historical scan needed
  const days = dateRange === "7d" ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const y = since.getFullYear();
  const m = String(since.getMonth() + 1).padStart(2, "0");
  const d = String(since.getDate()).padStart(2, "0");
  return `after:${y}/${m}/${d}`;
}

// Gmail's rate limits are a hard constraint (per CLAUDE.md) — real backoff,
// not a naive retry loop.
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

export async function fetchGmailMessagesForRange(
  oauth2Client: InstanceType<typeof google.auth.OAuth2>,
  dateRange: BacklogDateRange
): Promise<FetchedMessage[]> {
  const query = dateRangeToQuery(dateRange);
  if (query === null) return [];

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const { data } = await withBackoff(() =>
      gmail.users.messages.list({ userId: "me", q: query, pageToken, maxResults: 500 })
    );
    for (const m of data.messages ?? []) {
      if (m.id) ids.push(m.id);
    }
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  // Batched/concurrent fetch (bounded), not one-request-per-email sequentially.
  const results: FetchedMessage[] = [];
  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const fetched = await Promise.all(
      batch.map((id) =>
        withBackoff(() =>
          gmail.users.messages.get({
            userId: "me",
            id,
            format: "metadata",
            metadataHeaders: ["Subject", "From", "Date"],
          })
        )
      )
    );
    for (const { data } of fetched) {
      const headers = data.payload?.headers ?? [];
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      results.push({
        gmailMessageId: data.id!,
        gmailThreadId: data.threadId!,
        subject,
        from,
        receivedAt: new Date(Number(data.internalDate)).toISOString(),
        snippet: data.snippet ?? "",
      });
    }
  }

  return results;
}
