# UI/UX Design Brief — MailPilot

**Screen/Flow:** Full app (Phase 1: Inbox dashboard, Onboarding, Settings)
**Audience:** Knowledge workers/professionals who want their inbox handled with minimal cognitive load — values calm, uncluttered tools (Notion, Superhuman, Linear users).
**Brand:** Calm, restrained, quietly confident. Not playful, not corporate-cold. The visual opposite of a busy dashboard with competing colors and dense navigation.

---

## Aesthetic Direction

Clean light theme, generous whitespace, restrained color use. Color signals *hierarchy* (what's primary vs. secondary), not *category* — this is the core visual principle that separates MailPilot from typical inbox-management dashboards, which tend to color-code everything and end up visually loud. One accent color does the work of drawing attention; everything else recedes.

**Explicitly avoid:** multiple pastel category colors competing on one screen, dense edge-to-edge cards, more than one focal action per screen, bold headers on every section.

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| Primary accent | `#4A6B5C` (deep sage green) | Primary buttons, active nav state, the `Priority` label color, links |
| Accent hover/pressed | `#3A5548` | Button hover/active states |
| Background | `#FAF8F3` (warm off-white/cream) | Page background — not stark white |
| Surface (cards) | `#FFFFFF` | Cards, panels, modals — sits slightly lighter than the page background |
| Text primary | `#1F2421` | Headings, primary body text |
| Text secondary | `#6B7268` | Metadata, timestamps, secondary labels |
| Border/divider | `#E8E4DB` | Card borders, dividers — subtle, warm-toned gray, not cold gray |
| Success/positive | `#4A6B5C` (same as accent) | "All caught up" states — reuses accent rather than introducing green-as-a-new-color |
| Error/destructive | `#B3543F` (muted terracotta) | Only for genuine errors/destructive confirmations — used sparingly, never for priority signaling |

Notably: **no separate "urgent red"** — since MailPilot uses a single `Priority` label rather than a 3-tier color-coded system, there's no need for a traffic-light palette at all. This is a direct structural consequence of the Option E label decision.

---

## Typography

- **Font:** Inter (UI text) — clean, neutral, widely available, reads well at small sizes. Single font family throughout, no secondary display font.
- **Scale:** 3 sizes only —
  - Heading: 20px / semibold
  - Body: 14px / regular
  - Small/meta: 12px / regular, text-secondary color
- No bold headers beyond the single heading size. Weight and size restraint is the point — avoid the temptation to add a 4th size "just for this one section."

---

## Component Style

- **Border radius:** 8px throughout — cards, buttons, inputs. Consistent, not sharp, not overly rounded.
- **Shadows:** Single subtle shadow token for elevated surfaces (cards, dropdowns) — `0 1px 3px rgba(0,0,0,0.06)`. No heavy drop shadows anywhere.
- **Spacing:** Minimum 24px padding inside cards (explicitly more generous than Tame My Inbox's edge-to-edge density). 16px gap between list items minimum.
- **Buttons:** One primary (filled, sage green) button per screen maximum. All other actions are secondary (outlined or text-only, gray).

---

## Key UI Patterns

**Inbox dashboard (primary screen):**
- One clear focal action: e.g. "Review Priority (6)" as the single filled button. Everything else (refresh, settings, filters) is a smaller icon-button or text link, not competing visually.
- List of flagged emails, each showing: sender, one-line reason for flagging, timestamp (fetched live, not cached) — no snippet caching per the data policy.
- Everything *not* flagged simply isn't shown here by default — no dense "everything sorted into 4 buckets" view. A secondary "View all" or "Browse by category" link exists for people who want it, but it's not the default view.

**Navigation (sidebar):**
- Full nav shown from v1, but only "Inbox" and "Settings" are active/clickable.
- Future items (Commitments, Unsubscribe, etc.) shown in the same list, visually muted (lower opacity text, no hover state) with a small "Coming soon" tag — not literally disabled-gray/broken-looking.

**Motion:**
- When an email gets classified and labeled, its list item does a brief (150–200ms) fade + slight upward slide into place — signals "something just happened" without being distracting. Standard ease-out timing.
- No motion on page load beyond a simple fade-in for the whole view.

**Empty/zero state (intentionally designed, not default):**
- When there's nothing needing attention: a centered, calm message — not a generic "No items found." Something like "You're all caught up" with a small illustration or icon in the accent color, and a subtle secondary line like "MailPilot is watching your inbox — you'll see anything that needs you here."

---

## Dark/Light Mode

Light mode only for v1 (matches the "clean, Notion/Superhuman" direction and reduces build scope). Dark mode can be considered post-v1 if requested.

---

## Reference Apps

Notion and Superhuman for restraint, whitespace, and single-accent-color discipline. Explicitly *not* modeling the multi-color category-card pattern seen in Tame My Inbox's dashboard — that's the pattern MailPilot is deliberately differentiating from.

---

## Mobile

Fully responsive. On narrow viewports: sidebar collapses to a bottom tab bar or hamburger menu (implementation detail for the Implementation Plan), single-column card list, same spacing/typography scale (no separate mobile type scale needed at this size range).

---

## Accessibility

- Text/background contrast checked against WCAG AA at minimum (sage green `#4A6B5C` on cream `#FAF8F3` background needs verification at implementation time — may need a slightly darker accent for small text use).
- No information conveyed by color alone — the `Priority` label always pairs with visible text ("Priority"), not just a color dot.
- All interactive elements reachable via keyboard, visible focus states in the accent color.
