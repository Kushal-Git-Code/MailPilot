"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface CustomCategoryItem {
  id: string;
  name: string;
  description: string;
}

const MAX_NAME_LENGTH = 40;
const MAX_DESCRIPTION_LENGTH = 200;

export function CategoryManager({ initialCategories }: { initialCategories: CustomCategoryItem[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/settings/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      setName("");
      setDescription("");
      router.refresh();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong — try again.");
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/settings/categories/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl bg-surface p-6 shadow-glow">
        <h2 className="text-sm font-semibold text-foreground">Add a category</h2>
        <p className="mt-1 text-xs text-text-secondary">
          MailPilot will classify new mail into this too, alongside the default categories — it won&apos;t reach
          back and re-sort mail already processed.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <label htmlFor="category-name" className="text-xs font-medium text-text-secondary">
              Name
            </label>
            <input
              id="category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g. Finance"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="category-description" className="text-xs font-medium text-text-secondary">
              Description
            </label>
            <input
              id="category-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={MAX_DESCRIPTION_LENGTH}
              placeholder="e.g. Bills, invoices, and banking"
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-xl bg-gradient-to-r from-accent to-accent-hover px-5 py-2.5 text-sm font-semibold text-white shadow-glow disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add category"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl bg-surface p-6 shadow-glow">
        <h2 className="text-sm font-semibold text-foreground">Your categories</h2>
        {initialCategories.length === 0 ? (
          <p className="mt-2 text-sm text-text-secondary">
            No custom categories yet — the 5 default categories are always available.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {initialCategories.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="truncate text-xs text-text-secondary">{cat.description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="shrink-0 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50"
                >
                  {deletingId === cat.id ? "Removing..." : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
