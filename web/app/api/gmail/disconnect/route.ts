import { google } from "googleapis";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: tokenRow } = await supabase
    .from("gmail_tokens")
    .select("refresh_token, status")
    .eq("user_id", user.id)
    .single();

  if (tokenRow && tokenRow.status === "active") {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );
    try {
      await oauth2Client.revokeToken(decrypt(tokenRow.refresh_token));
    } catch (err) {
      // Token may already be invalid/expired at Google's end — still
      // proceed to mark it revoked locally so the user isn't stuck.
      console.error("Google token revoke failed (continuing to mark revoked locally):", err);
    }
  }

  await supabase.from("gmail_tokens").update({ status: "revoked" }).eq("user_id", user.id);

  return NextResponse.redirect(`${origin}/onboarding/connect?message=disconnected`);
}
