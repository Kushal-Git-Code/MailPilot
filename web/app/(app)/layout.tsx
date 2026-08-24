import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";

// Shared shell for every authenticated section (Inbox, Settings, and future
// Coming-soon sections) — a Next.js route group, so it adds no path segment;
// /dashboard and /settings/* URLs are unchanged. Auth itself stays enforced
// by middleware.ts, same as before this existed.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Google OAuth logins carry a real display name; email/password ones don't
  // — email is always available as the fallback, same value shown elsewhere.
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const email = user?.email ?? "";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar displayName={displayName} email={email} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
