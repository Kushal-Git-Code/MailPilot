import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/dashboard";
  // Only allow same-origin relative paths — an unvalidated `next` param is
  // an open-redirect vector (e.g. next=//evil.com or next=https://evil.com).
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//") && !requestedNext.startsWith("/\\")
      ? requestedNext
      : "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
