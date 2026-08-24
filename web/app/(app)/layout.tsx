import { Sidebar } from "./sidebar";

// Shared shell for every authenticated section (Inbox, Settings, and future
// Coming-soon sections) — a Next.js route group, so it adds no path segment;
// /dashboard and /settings/* URLs are unchanged. Auth itself stays enforced
// by middleware.ts, same as before this existed.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}
