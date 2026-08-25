"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Supabase's confirm-signup email link lands on this app's configured Site
// URL — this root page — with the result encoded directly in the URL:
// either a hash fragment (#error=... or #access_token=...&refresh_token=...,
// the implicit-flow shape) or a query string (?error=...). Nothing here
// previously read either, so an expired/invalid confirmation link silently
// rendered the plain marketing page as if nothing had happened, and even a
// valid link's tokens would have sat unused in the hash with no session
// ever established. Runs once on mount to forward both cases somewhere
// that actually shows the result.
export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const hashParams = new URLSearchParams(hash);
    const queryParams = new URLSearchParams(window.location.search);

    const error = hashParams.get("error") ?? queryParams.get("error");
    const errorCode = hashParams.get("error_code") ?? queryParams.get("error_code");
    const errorDescription = hashParams.get("error_description") ?? queryParams.get("error_description");

    if (error) {
      const params = new URLSearchParams({ error });
      if (errorCode) params.set("error_code", errorCode);
      if (errorDescription) params.set("error_description", errorDescription);
      router.replace(`/login?${params.toString()}`);
      return;
    }

    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");
    if (accessToken && refreshToken) {
      const supabase = createClient();
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: sessionError }) => {
        router.replace(sessionError ? "/login?error=auth_callback_failed" : "/dashboard");
      });
    }
  }, [router]);

  return null;
}
