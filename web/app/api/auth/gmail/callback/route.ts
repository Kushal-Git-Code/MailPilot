import { google } from "googleapis";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "shared";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = cookies();
  const expectedState = cookieStore.get("gmail_oauth_state")?.value;
  cookieStore.delete("gmail_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/onboarding/connect?error=gmail_oauth_failed`);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Google did not return both an access token and a refresh token");
    }

    oauth2Client.setCredentials(tokens);
    // Read the connected address via the Gmail API itself (gmail.readonly
    // scope already covers this) rather than requesting an extra userinfo
    // scope we haven't declared in docs/trd.md.
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const { data: profile } = await gmail.users.getProfile({ userId: "me" });

    const { error: dbError } = await supabase.from("gmail_tokens").upsert(
      {
        user_id: user.id,
        access_token: encrypt(tokens.access_token),
        refresh_token: encrypt(tokens.refresh_token),
        token_expires_at: new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString(),
        gmail_address: profile.emailAddress,
        status: "active",
      },
      { onConflict: "user_id" }
    );
    if (dbError) throw dbError;

    return NextResponse.redirect(`${origin}/onboarding/backlog`);
  } catch (err) {
    console.error("Gmail OAuth callback failed:", err);
    return NextResponse.redirect(`${origin}/onboarding/connect?error=gmail_oauth_failed`);
  }
}
