import { google } from "googleapis";
import { decrypt } from "shared";
import { createClient } from "@/lib/supabase/server";

export async function getGmailClientForUser(userId: string) {
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
  oauth2Client.setCredentials({ refresh_token: decrypt(tokenRow.refresh_token) });
  return google.gmail({ version: "v1", auth: oauth2Client });
}
