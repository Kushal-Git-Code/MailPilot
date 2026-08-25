import { google } from "googleapis";
import { decrypt } from "shared";
import { createClient } from "@/lib/supabase/server";

interface CachedAccessToken {
  // The refresh_token this access_token was issued for — a cache hit is
  // only valid if this still matches the row currently in gmail_tokens.
  // Without pinning to it, a disconnect+reconnect (same or different
  // Google account) within the access token's ~1hr lifetime would reuse a
  // stale, mismatched credential: userId alone doesn't change across a
  // reconnect, so a cache keyed only on userId can't tell the old
  // authorization apart from the new one. Caught by an automated security
  // review right after this cache was first added — real finding, not a
  // false positive.
  refresh_token: string;
  access_token: string;
  expiry_date: number;
}

// In-memory, per-process cache of short-lived Google access tokens — same
// pattern as gmailDisplay.ts's cache, and covered by the same "never
// Redis/Postgres/disk" rule (this holds a live credential, not email
// content, but the reasoning for staying process-memory-only still
// applies). Without this, every request builds a fresh OAuth2Client with
// only the long-lived refresh_token, forcing a full token-refresh round
// trip to Google before the *first* Gmail API call can even go out — on
// every single dashboard load, not just the first one after a restart.
const accessTokenCache = new Map<string, CachedAccessToken>();

export async function getOAuth2ClientForUser(userId: string) {
  const supabase = createClient();
  const { data: tokenRow } = await supabase
    .from("gmail_tokens")
    .select("refresh_token, status")
    .eq("user_id", userId)
    .single();
  if (!tokenRow || tokenRow.status !== "active") return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  const refreshToken = decrypt(tokenRow.refresh_token);

  // 60s safety buffer so a near-expiry cached token isn't handed to a
  // Gmail API call that then fails mid-flight instead of refreshing first.
  // Pinned to refresh_token (see CachedAccessToken) so a reconnect can't
  // accidentally reuse a token issued under the previous connection.
  const cached = accessTokenCache.get(userId);
  const cachedIsFresh =
    cached && cached.refresh_token === refreshToken && cached.expiry_date > Date.now() + 60_000;

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
    ...(cachedIsFresh ? { access_token: cached!.access_token, expiry_date: cached!.expiry_date } : {}),
  });

  // googleapis refreshes lazily and fires this whenever it does — capture
  // the new token so the *next* request in this process gets a cache hit
  // instead of refreshing again itself.
  oauth2Client.on("tokens", (tokens) => {
    if (tokens.access_token && tokens.expiry_date) {
      accessTokenCache.set(userId, { refresh_token: refreshToken, access_token: tokens.access_token, expiry_date: tokens.expiry_date });
    }
  });

  return oauth2Client;
}

export async function getGmailClientForUser(userId: string) {
  const oauth2Client = await getOAuth2ClientForUser(userId);
  if (!oauth2Client) return null;
  return google.gmail({ version: "v1", auth: oauth2Client });
}
