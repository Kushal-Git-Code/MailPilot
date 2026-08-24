import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CATEGORIES } from "shared";

const MAX_NAME_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_CUSTOM_CATEGORIES = 10;

interface CustomCategoryRow {
  id: string;
  rule_data: { name?: string; description?: string };
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("rules")
    .select("id, rule_data")
    .eq("user_id", user.id)
    .eq("rule_type", "category_definition")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const categories = ((data ?? []) as CustomCategoryRow[])
    .filter((row) => row.rule_data.name && row.rule_data.description)
    .map((row) => ({ id: row.id, name: row.rule_data.name!, description: row.rule_data.description! }));

  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";

  if (!name || !description) {
    return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` }, { status: 400 });
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }
  // Can't collide with a default category name — the classifier's schema
  // unions defaults + custom categories into one enum; a duplicate name
  // would make that enum ambiguous.
  if ((DEFAULT_CATEGORIES as readonly string[]).some((c) => c.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: `"${name}" is already a default category name` }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("rules")
    .select("id, rule_data")
    .eq("user_id", user.id)
    .eq("rule_type", "category_definition")
    .eq("active", true);
  if (existingError) throw existingError;

  const existingCategories = (existing ?? []) as CustomCategoryRow[];
  if (existingCategories.length >= MAX_CUSTOM_CATEGORIES) {
    return NextResponse.json(
      { error: `You can only have up to ${MAX_CUSTOM_CATEGORIES} custom categories` },
      { status: 400 }
    );
  }
  if (existingCategories.some((row) => row.rule_data.name?.toLowerCase() === name.toLowerCase())) {
    return NextResponse.json({ error: `You already have a category named "${name}"` }, { status: 409 });
  }

  const { data: newRule, error: insertError } = await supabase
    .from("rules")
    .insert({
      user_id: user.id,
      rule_type: "category_definition",
      rule_data: { name, description },
      active: true,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;

  return NextResponse.json({ id: newRule.id, name, description });
}
