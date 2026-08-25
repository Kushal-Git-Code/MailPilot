import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  const redirect = !user && !isPublic;
  const target = redirect ? NextResponse.redirect(new URL("/login", request.url)) : response;

  // A stale session (the account behind it was deleted, the refresh token
  // was already used/revoked, or the JWT's user no longer exists) makes
  // getUser() fail the same way on every single request forever unless the
  // cookie is actually cleared — logged (and noisy) here, but harmless:
  // getUser() already degrades to user=null so the redirect above still
  // happens correctly. This just stops the doomed cookie from being resent
  // and re-logged. Matched on HTTP status rather than a specific error code
  // — Supabase surfaces this same class of "session is no longer valid"
  // problem under several different codes (refresh_token_not_found,
  // refresh_token_already_used, user_not_found, bad_jwt, ...), confirmed by
  // reproducing two of them live; a status-based check covers the whole
  // 4xx auth-invalid class without needing to enumerate every code.
  // Deliberately excludes 5xx — a transient outage shouldn't sign anyone out.
  if (error && error.status !== undefined && error.status >= 400 && error.status < 500) {
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith("sb-")) target.cookies.delete(cookie.name);
    });
  }

  return target;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
