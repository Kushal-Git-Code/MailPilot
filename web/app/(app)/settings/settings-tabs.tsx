import Link from "next/link";

// Lightweight cross-links between Settings sub-pages — not a client component,
// no interactivity needed beyond plain links, so this stays server-rendered.
const TABS = [
  { key: "account", label: "Account", href: "/settings/account" },
  { key: "plan", label: "Plan & usage", href: "/settings/plan" },
  { key: "categories", label: "Categories", href: "/settings/categories" },
] as const;

export function SettingsTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          aria-current={tab.key === active ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 ${
            tab.key === active
              ? "bg-gradient-to-r from-accent to-gold text-white shadow-glow"
              : "bg-surface text-text-secondary hover:text-foreground"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
