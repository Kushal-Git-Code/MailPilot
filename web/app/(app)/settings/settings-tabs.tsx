// Lightweight cross-links between Settings sub-pages — not a client component,
// no interactivity needed beyond plain links, so this stays server-rendered.
// Only Account and Plan exist so far; Categories (Step 32) will be added here
// once it's actually built, not before.
const TABS = [
  { key: "account", label: "Account", href: "/settings/account" },
  { key: "plan", label: "Plan & usage", href: "/settings/plan" },
] as const;

export function SettingsTabs({ active }: { active: (typeof TABS)[number]["key"] }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-border">
      {TABS.map((tab) => (
        <a
          key={tab.key}
          href={tab.href}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            tab.key === active
              ? "border-b-2 border-accent text-accent"
              : "text-text-secondary hover:text-foreground"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
  );
}
