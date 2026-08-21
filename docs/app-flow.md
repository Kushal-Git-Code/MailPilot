# App Flow — MailPilot (Phase 1)

---

## Pages List

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing/signup page — logged-out only |
| Sign up / Log in | `/login` | Supabase Auth (email + Google) |
| Onboarding — Connect Gmail | `/onboarding/connect` | Google OAuth consent for Gmail access |
| Onboarding — Backlog range | `/onboarding/backlog` | User picks the date range for initial classification |
| Dashboard (Inbox) | `/dashboard` | Primary screen — list of emails flagged `Priority`, "all caught up" empty state when none |
| Browse / All categories | `/dashboard/all` | Secondary view — everything classified, grouped by user-customizable category |
| Settings — Account | `/settings/account` | Profile, connected Gmail account, disconnect |
| Settings — Categories | `/settings/categories` | Manage custom classification categories |
| Settings — Plan | `/settings/plan` | Free tier usage (of 75/day cap), upgrade path (future) |

Sidebar-only entries shown as **"Coming soon"** (not routable in v1): Commitments, Unsubscribe (Phase 2).

---

## Navigation Type

Left sidebar (desktop) — collapses to a bottom tab bar or hamburger drawer on mobile (per `docs/ui-ux-brief.md`). Only **Inbox** and **Settings** are active/clickable; future items are visible but visually muted with a "Coming soon" tag, per the earlier design decision.

---

## First Screen

A brand-new, logged-out visitor lands on `/` — a simple marketing page: value proposition, "Start Free" CTA, no functional app behind it until they sign up.

---

## Auth Flow

```
/ (landing)
  → Sign Up (Supabase Auth: email or Google)
  → /onboarding/connect (Google OAuth — Gmail-specific consent,
     separate from Supabase login even if same Google account)
  → /onboarding/backlog (pick date range: "Last 7 days" /
     "Last 30 days" / "From today forward only")
  → /dashboard (backlog classification begins processing in
     background; dashboard shows "processing" state until done)
```

Returning user: `/login` → straight to `/dashboard` (skips onboarding entirely if Gmail is already connected).

If a logged-in user's Gmail token has been revoked externally (detected on next API call): redirected to `/onboarding/connect` with a message explaining reconnection is needed — never silently fails.

---

## Core User Journey 1 — Daily triage check

1. User opens `/dashboard`.
2. Sees either: (a) a short list of emails flagged `Priority` with one-line reasons, or (b) the "You're all caught up" empty state if nothing needs attention.
3. User clicks an email → opens directly in Gmail (new tab) to read/reply — MailPilot does not replicate an email reading/reply UI in Phase 1.
4. If a classification felt wrong, user clicks a small "Not priority" or "Actually priority" correction control inline — this updates the label immediately and is logged for future rule learning (US-3).

---

## Core User Journey 2 — First-time connect & backlog review

1. New user signs up, connects Gmail (`/onboarding/connect`).
2. Picks a backlog range (`/onboarding/backlog`).
3. Lands on `/dashboard` in a "processing" state — a progress indicator, not a blank/broken-looking screen.
4. As classification completes, the dashboard updates live (or on refresh in v1 if real-time isn't wired up yet) — flagged emails appear with the fade/slide-in motion from the design brief.
5. User reviews the first batch, makes any corrections, and the loop from Journey 1 begins going forward.

---

## Empty States

- **Dashboard, nothing flagged:** "You're all caught up" — calm, designed state per `docs/ui-ux-brief.md`, not a generic "no data" message.
- **Backlog still processing:** progress indicator + reassuring copy ("MailPilot is going through your last 30 days — this usually takes a few minutes").
- **No categories customized yet:** default category set shown with an inline prompt to customize, not a blank settings page.

---

## Error States

- **Gmail OAuth fails/is denied during connect:** clear retry option on `/onboarding/connect`, explains what permission is being requested and why.
- **Classification API (Claude) call fails:** affected email(s) shown as "Pending" in the dashboard, not silently dropped — a background retry happens automatically; no user-facing error unless retries are exhausted.
- **Gmail rate limit hit:** dashboard shows "still processing, this is taking longer than usual" rather than a hard error.
- **Free tier cap (75/day) reached:** dashboard shows remaining emails as "Queued — resumes tomorrow" rather than blocking or erroring.
- **Network/session expired:** standard redirect to `/login`, with the user returned to where they were after re-authenticating.

---

## Redirects

| After action | Goes to |
|---|---|
| Sign up | `/onboarding/connect` |
| Gmail connected | `/onboarding/backlog` |
| Backlog range chosen | `/dashboard` |
| Log in (already onboarded) | `/dashboard` |
| Log out | `/` |
| Disconnect Gmail (from settings) | `/onboarding/connect` (with a "reconnect anytime" message, account/data not deleted) |
