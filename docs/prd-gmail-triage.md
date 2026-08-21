# PRD — Gmail Inbox Triage (Phase 1)

**Feature:** Automatic Gmail inbox triage — AI classifies incoming/existing emails by priority and category, applies Gmail labels accordingly, and surfaces a summary dashboard.
**Users:** Individual knowledge workers/professionals overwhelmed by email volume (target: 50–150+ emails/day) who use Gmail as their primary inbox.
**Stack:** Next.js 14 (TypeScript, Tailwind) frontend · Node/FastAPI backend · PostgreSQL via Supabase · Claude API for classification · Google OAuth + Gmail API · Vercel (frontend) + Railway (backend/worker) + Supabase (DB).

---

## Problem Statement

Knowledge workers spend a large share of their workday on email triage — sorting, scanning, and deciding what to ignore — before they even get to the messages that actually need a reply. This is repetitive, low-value cognitive work that AI can do reliably. MailPilot removes the triage layer: it reads incoming Gmail, classifies each message, and organizes the inbox automatically, so the user only opens what needs their judgment.

**Success metrics (v1):**
- ≥ 80% of auto-applied classifications require no manual re-sort by the user (measured via label-change-within-24h rate).
- Median time for a user to reach "inbox zero on priority mail" drops by ≥ 50% vs. their self-reported baseline.
- Zero incidents of an email being archived/labeled in a way that causes the user to miss something they consider urgent (tracked via an in-app "this was wrong" flag).

---

## User Stories & Acceptance Criteria

**US-1:** As a user, I want to connect my Gmail account so MailPilot can read and label my mail.
- *AC:* OAuth consent screen requests only `gmail.readonly` + `gmail.modify` (or `gmail.labels` if sufficient). Token stored encrypted. User can disconnect at any time from settings, which revokes the token and stops all processing immediately. MailPilot is fully additive — it never modifies, disables, or deletes any of the user's existing Gmail labels or filters; it only adds its own `MailPilot/Priority` label alongside whatever the user already has.
- *AC:* On connect, user picks a date range for backlog classification (not a fixed "last 500" default) — e.g. "last 7 days," "last 30 days," or "from today forward only."

**US-2:** As a user, I want new emails automatically classified so I don't have to read everything — only the ones that actually need me get flagged.
- *AC:* Classification runs within 2 minutes of an email arriving (polling in v1; push-based in v1.1). Emails that need attention get a single `MailPilot/Priority` Gmail label applied; everything else stays quietly unlabeled (no label = no action needed). Category tagging (e.g. Human, Notification, Newsletter, Transactional) is shown in the MailPilot dashboard only, not as separate Gmail labels, and categories are user-customizable — the default set is a starting point, not fixed.

**US-3:** As a user, I want to review and correct a classification, and have MailPilot learn from that correction going forward.
- *AC:* User can reassign priority/category from the dashboard in one click; the correction is stored and referenced in future prompts as a per-user preference signal (simple rule override in v1, not fine-tuning).

**US-4:** As a user, I want a daily summary of what got triaged, so I trust the system instead of babysitting it.
- *AC:* Dashboard shows: count triaged, count flagged urgent, count auto-archived, with a link to review any category.

**US-5:** As a user, I want an undo/safety net, so I never worry about losing an important email.
- *AC:* Every label/archive action is logged in an audit trail; nothing is ever permanently deleted by MailPilot; any action can be reversed with one click within 30 days.

---

## Scope

**Ships in v1:**
- Gmail OAuth connect/disconnect
- User-selected backlog date range classification on connect + ongoing polling-based classification of new mail
- Single `MailPilot/Priority` Gmail label for anything needing attention; category tagging shown in-dashboard only, user-customizable categories
- Free tier cap: 75 emails processed/day
- Dashboard: triage summary, per-email classification + reason, manual correction, undo
- Audit log of every automated action
- Zero email content storage — only metadata (message ID, classification, label, timestamps) persisted; snippets fetched live from Gmail, never cached

**Explicitly NOT in v1 (out of scope):**
- Reply drafting in the user's voice
- Voice assistant ("IRIS"-style) features
- Meeting prep / attendee context
- **Smart Unsubscribe (subscription scanner, one-click/bulk unsubscribe, mute) — confirmed feature, scoped to Phase 2**, not Phase 1. Uses `List-Unsubscribe`/`List-Unsubscribe-Post` headers with link-based fallback; mute implemented as an auto-archive Gmail filter.
- Real-time push notifications (Pub/Sub) — polling is acceptable for v1
- Multi-account / non-Gmail providers (Outlook, IMAP)
- Team/shared inbox support

---

## Data Model Changes

**Data policy: zero email content stored, ever.** No email body, no snippet, no attachments are persisted anywhere in MailPilot's database. Only metadata and classification results are stored. The dashboard fetches snippets live from the Gmail API on each view rather than caching them — this is a deliberate trust/privacy decision, not a performance shortcut.

New tables (detailed types in `docs/backend-schema.md`):
- `users` — app account
- `gmail_tokens` — encrypted OAuth tokens, per user, 1:1
- `emails` — Gmail message id, thread id, classification (priority, category, reason, confidence), applied_label, processed_at, user_corrected (bool) — **no body/snippet column**
- `rules` — user-defined overrides/preferences learned from corrections, plus user's custom category definitions
- `audit_log` — every automated action taken, with reversal capability

---

## Edge Cases & Failure States

- **Classification API call fails/times out** → email stays unclassified (visible in dashboard as "pending"), never silently dropped or auto-archived on failure.
- **User revokes Gmail access outside the app** (via Google account settings) → next API call fails auth; app detects this, halts processing, and prompts reconnect.
- **Gmail rate limit hit during backlog processing** → backend backs off and resumes; user sees a "still processing" state, not an error.
- **Email arrives that doesn't fit any category cleanly** → defaults to "Normal / Uncategorized," never silently deleted or hidden.
- **User has extremely high volume (500+ new emails/day)** → batching/queueing must not block the UI; dashboard shows "in progress" rather than blocking.
- **Duplicate processing** (e.g. worker retry) → must be idempotent; label application checks current state before re-applying.

---

## Decisions Log

All v1 open questions resolved as of this revision:
1. Free tier cap: **75 emails/day**.
2. Label naming: **single `MailPilot/Priority` label** — nothing else applied to the inbox.
3. Categories: **user-customizable**, shown in-dashboard only.
4. Existing Gmail labels/filters: **fully additive**, MailPilot never touches them.
5. Backlog scope: **user picks a date range** on connect.
6. Data storage: **zero email content stored**, metadata + classification results only.
7. Smart Unsubscribe: confirmed as a real feature, **scoped to Phase 2**.
