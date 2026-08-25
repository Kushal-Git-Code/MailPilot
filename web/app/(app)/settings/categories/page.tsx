import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SettingsTabs } from "../settings-tabs";
import { CategoryManager, type CustomCategoryItem } from "./category-manager";

// Categories can be added/removed elsewhere (this page itself) — never
// serve a stale cached list.
export const dynamic = "force-dynamic";

export default async function SettingsCategoriesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // middleware already guards this route

  const { data } = await supabase
    .from("rules")
    .select("id, rule_data")
    .eq("user_id", user.id)
    .eq("rule_type", "category_definition")
    .eq("active", true)
    .order("created_at", { ascending: true });

  const categories: CustomCategoryItem[] = (data ?? [])
    .map((row) => ({
      id: row.id,
      name: (row.rule_data as { name?: string }).name ?? "",
      description: (row.rule_data as { description?: string }).description ?? "",
    }))
    .filter((c) => c.name && c.description);

  return (
    <main className="relative min-h-screen overflow-hidden p-8">
      <div className="blob blob-1 -left-24 -top-24 h-72 w-72 bg-accent opacity-20" />
      <div className="blob blob-2 -bottom-24 -right-10 h-80 w-80 bg-tertiary opacity-20" />

      <div className="relative z-10 mx-auto max-w-2xl">
        <header className="mb-6">
          <h1 className="font-display text-xl font-bold text-foreground">Categories</h1>
          <Link href="/dashboard" className="text-xs font-medium text-accent hover:underline">
            &larr; Back to inbox
          </Link>
        </header>

        <SettingsTabs active="categories" />

        <CategoryManager initialCategories={categories} />
      </div>
    </main>
  );
}
