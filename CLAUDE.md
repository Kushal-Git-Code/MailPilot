# CLAUDE.md — MailPilot

> **Note:** No codebase exists yet, so this was written by hand from project decisions, not scanned from code. Once the initial scaffold exists, re-run the "Create Your CLAUDE.md" prompt (scan the codebase) to catch drift between what was intended here and what actually got built — then merge the results.

## What this project is
MailPilot is an AI email assistant that connects to a user's Gmail account and automatically triages incoming mail — classifying by priority/category and applying a single `MailPilot/Priority` label to what needs attention — so the user spends less time on manual sorting. Phase 1 = triage only, currently being built — **every later phase below waits until Phase 1 is fully live and proven to work well; only then does the next phase start, one at a time, not in parallel.** Phase 2 (not yet in scope) = Smart Unsubscribe (subscription scanner, bulk unsubscribe, mute). Phases 3-7 (not yet in scope, decided 2026-08-23, inspired by competitor "Tame My Inbox") = Reply Drafting, One-Click Actions, VIP Detection, Commitment Tracking, Email Analytics. Phases 8-9 (not yet in scope, decided 2026-08-24, inspired by competitor "Quell") = Receipt & Bill Filing, Plain-English Custom Rules — see the "Future phase" sections below for each. No voice assistant planned currently.

## Future phase: Reply Drafting (Phase 3 — not yet started)
Decided 2026-08-23, inspired by competitor "Tame My Inbox" (their "IRIS" assistant / "Quick Replies" feature). Do not build any part of this until Phase 1 (triage) and Phase 2 (Smart Unsubscribe) are both live — this section exists to capture the design intent now, before it's forgotten, not to greenlight starting it.

- **Scope:** for a subset of `Human`-category emails classified as short/simple (e.g. a quick yes/no/confirmation reply), generate a draft reply via a second Claude call, using the same transient-content pattern already used for classification (full body sent to Claude for that one call, never persisted).
- **Delivery mechanism — write the draft directly into Gmail as a real Gmail Draft** (`drafts.create` via the Gmail API), the same way the Priority label is written directly into Gmail today. Do **not** store draft text in our own database — same zero-content-storage principle as email bodies, applied to generated content too.
- **MailPilot must never call Gmail's Send API.** The draft sits in Gmail, unsent, until the user reviews/edits and sends it themselves natively in Gmail. This is a deliberate scope boundary: creating a discardable, reversible draft is an additive action similar to labeling; actually sending an email on the user's behalf is a fundamentally different, much higher-trust action that this project is not taking on.
- **OAuth scope impact:** this will require declaring and requesting a wider Gmail scope (likely `gmail.compose`, or confirm whether `gmail.modify` already covers draft creation) — per the existing hard rule below, this needs explicit approval and reconsideration of the Google verification review before implementation starts, not something to slip in incidentally.
- **Dashboard impact:** a new "Quick Replies" section, distinct from the existing Priority list, showing each drafted reply's text so the user can judge it before ever opening Gmail.

## Future phase: One-Click Actions — Archive & Snooze (Phase 4 — not yet started)
Decided 2026-08-23, inspired by Tame My Inbox's "one-click actions: archive, reply, snooze." "Reply" here is already covered by Phase 3 above — this phase is just Archive and Snooze.

- **Archive:** straightforward — a dashboard button calling the Gmail API to remove the `INBOX` label from a message. Already compatible with the existing hard rules (archive-only, reversible, must be logged to `audit_log` before the write, same pattern as the Priority label).
- **Snooze:** Gmail has no public API for its own snooze feature (it's client-side only in Gmail's UI) — MailPilot would need to build this itself: store a `snoozed_until` timestamp against the email's row (metadata only, no content — compatible with the zero-content-storage rule), hide it from the dashboard until that time, then re-surface it via a scheduled job. This needs its own design pass when the phase actually starts (e.g. does re-surfacing need a new notification, or is it passive — just reappears next time the dashboard is opened).

## Future phase: VIP Detection (Phase 5 — not yet started)
Decided 2026-08-23, inspired by Tame My Inbox's "VIP detection so you never miss important people."

- **Scope:** let the user mark specific senders as VIP (in Settings). Any email from a VIP sender is deterministically flagged `priority: true`, overriding the AI classification rather than just influencing it — the point is a guarantee, not a nudge.
- **Likely fits the existing `rules` table** (already in the schema, and already slated in `docs/implementation-plan.md` Step 32 for user-customizable classification categories) — VIP sender lists are a natural extension of the same rules mechanism rather than a new table.

## Future phase: Commitment Tracking (Phase 6 — not yet started)
Decided 2026-08-23, inspired by Tame My Inbox's "IRIS automatically extracts promises, deadlines, and action items from your emails" (track what you owe / what's owed to you, get nudged as deadlines approach).

- **Open policy question to resolve before this phase starts, not silently assumed:** extracting a commitment means generating and storing a short paraphrase of email content (e.g. "you promised to send the report by Friday") — even a short AI-generated summary is still content *derived from* the email body, which sits in real tension with the current hard rule of never storing any email content, ever. This needs an explicit decision (and probably an explicit update to that hard rule's wording) before writing any code here, not a quiet workaround.
- **Scope (pending that decision):** a second Claude pass extracts promises/deadlines/action items per email, direction (owed by the user vs. owed to the user), and a due date if present. New `commitments` table, linked back to `gmail_message_id` the same way `emails` already links back to Gmail.
- **Deadline nudges:** needs its own delivery-mechanism decision (in-app only, vs. email, vs. push) — not decided yet.

## Future phase: Email Analytics (Phase 7 — not yet started)
Decided 2026-08-23, inspired by Tame My Inbox's "see how much time you saved, who emails you most, and where your inbox trends are heading" (volume trends, response times, busiest hours, relationship health, time-saved ROI).

- **Scope:** aggregate reporting dashboard built from data already compatible with the zero-content-storage rule — volume/timing trends come from `emails.received_at` + classification metadata already stored; "relationship health" (who's going cold/most engaged) is derived from per-sender timestamp trends, not content. Response-time metrics would need additional Gmail API calls (thread reply timestamps) not currently made anywhere in the pipeline.
- **Time-saved ROI is inherently an estimate** (some assumed average minutes-saved-per-triaged-email), not a real measurement — should be presented as such, not as a precise metric.

## Future phase: Receipt & Bill Filing (Phase 8 — not yet started)
Decided 2026-08-24, inspired by competitor "Quell" (meetquell.com) — their "bill/receipt management" feature identifies and reconciles financial correspondence automatically. Do not build any part of this until Phases 1-7 are live and proven, per the sequencing rule above.

- **Scope:** a dedicated category/view for receipts, invoices, and subscription billing emails — distinct from the existing `Transactional` default category (which is broader: shipping notifications, password resets, etc. all currently land there too). Likely needs either a new sub-classification within `Transactional`, or a dedicated financial-document detector as a second pass.
- **Open question, not yet decided:** whether this stays purely a *display* grouping (dashboard-only, like category correction today) or evolves toward actual "reconciliation" (e.g. flagging a subscription's price change, or surfacing recurring charges) — the latter would need to store more structured data than MailPilot currently keeps for any email, raising the same zero-content-storage tension already flagged for Commitment Tracking (Phase 6). Needs its own explicit decision before scoping further.
- **Zero-content-storage still applies:** any implementation must fetch amounts/vendors live at render time from Gmail, the same pattern `gmailDisplay.ts` already uses for sender/subject — never persisted to Postgres, unless the open question above is explicitly resolved otherwise.

## Future phase: Plain-English Custom Rules (Phase 9 — not yet started)
Decided 2026-08-24, inspired by competitor "Quell" — their natural-language inbox commands (e.g. "re-label everything from Stripe as Finance"). Do not build any part of this until Phases 1-8 are live and proven, per the sequencing rule above.

- **Scope:** let the user type a plain-English rule (or forward an email with an instruction) and have Claude translate it into a structured entry in the existing `rules` table — the same table already used for per-sender priority (`correction_signal`) and category (`category_correction_signal`) preferences. This is a natural generalization of that existing mechanism, not a new subsystem: instead of only being created via the dashboard's correction buttons, a rule could also be created via a typed instruction that Claude parses into the same `{sender, priority}` / `{sender, category}` shape (or a new rule_type if the instruction doesn't fit those two).
- **Relationship to VIP Detection (Phase 5):** VIP detection is really the single specific case "always flag emails from sender X as priority" — once this phase exists, VIP marking could arguably be reimplemented as one specific plain-English rule rather than its own separate mechanism. Worth revisiting Phase 5's design at that point rather than building both independently.
- **Open question, not yet decided:** how much freedom to give the instruction parser (sender-based rules only, like today's corrections, vs. broader conditions like subject-line keywords) — broader conditions raise new questions about what MailPilot is allowed to match against without violating zero-content-storage (matching live, per-email, is fine; *storing* a keyword rule that references subject text is a much smaller ask than storing email content itself, but still needs an explicit decision, not a silent assumption).
- **Decided 2026-08-24, during Step 32 (custom categories) planning:** Step 32 ships a simple structured form (category name + description → a `category_definition` rule) now, not a natural-language parser — that's deliberately this phase's job, not pulled forward. When this phase actually starts, build the plain-English layer *on top of* Step 32's structured mechanism (parse the instruction into the same `{name, description}` shape and write the same kind of `rules` row), not as a second, separate category system.

## Tech stack + versions that matter
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Backend: Node.js (or FastAPI/Python — confirm before scaffolding, do not mix both without a reason)
- Database: PostgreSQL via Supabase
- Auth: Supabase Auth (app login) + Google OAuth (Gmail access, separate token flow)
- LLM: Claude API (Anthropic) — use the cheapest model that hits the accuracy bar on the eval set; do not default to the largest model without justification
- Hosting: Vercel (frontend), Railway (backend + worker + Redis), Supabase (DB)
- Queue: BullMQ (if Node) or Celery (if Python) + Redis

## Commands
- Dev: *(fill in once scaffolded, e.g. `npm run dev`)*
- Build: *(fill in, e.g. `npm run build`)*
- Test: *(fill in, e.g. `npm test`)*
- Lint: *(fill in, e.g. `npm run lint`)*

## Architecture: where things live and why
- `/web` — Next.js frontend (dashboard, onboarding, settings)
- `/api` — backend API (OAuth callback, REST endpoints)
- `/worker` — background job processor (email fetch, classification, label writes)
- `/docs` — PRD, TRD, App Flow, UI/UX Brief, Backend Schema, Implementation Plan — source of truth, reference explicitly in prompts
- `/evals` — labeled test emails + expected classifications, used to validate prompt changes before trusting them

## Code conventions
*(To be filled in once real code exists and patterns are established — do not invent generic conventions here.)*

## Hard rules — never do these without asking first
- **Never store email body content, snippets, subject, or attachments in the database — ever, under any circumstance.** Only IDs, classification results, and timestamps are persisted by default. Subject and any preview text are fetched live from the Gmail API at render time, using the stored `gmail_message_id` — never cached or written to Postgres. This is a core product trust commitment, not a performance decision — do not "optimize" it away by adding caching later without explicit approval.
  - **Narrow, deliberate exception (decided 2026-08-23, for US-3's manual-correction feature):** the sender's email address may be stored, but **only** when a user explicitly submits a correction on that specific email (clicks "not priority" / "mark as priority") — never for display, never for caching, never for any email that hasn't been manually corrected. Stored permanently in the `rules` table as a per-sender preference signal (until the user removes/changes it), not attached to any single email row. Sender is still never stored for the general/default case — this is the one specific, user-triggered, opt-in-by-action exception, chosen over storing it for every email (rejected) or a hashed version (rejected — real address chosen instead, after discussing the tradeoff).
- **Never** apply more than the single `MailPilot/Priority` label to an email. Category info is dashboard-only, not a Gmail label.
- **Never** modify, disable, or interact with a user's existing (non-MailPilot) Gmail labels or filters. Fully additive only.
- **Never** permanently delete a user's email. Archive/label only. Every automated action must be reversible.
- **Never** commit `.env`, tokens, or any secret — check `.gitignore` covers them before every commit involving config.
- **Never** apply a Gmail label/archive action without it being logged to the `audit_log` table first.
- **Never** widen OAuth scopes beyond what's declared in `docs/trd.md` without explicit approval — this affects Google's app verification review.
- **Never** ship a classification prompt change without running it against `/evals` first and showing the before/after precision/recall.
- **Always** treat Gmail API rate limits as a hard constraint — implement backoff, don't just retry in a loop.
- **Always** update `PROGRESS.md` at the end of any session where a step from `docs/implementation-plan.md` was completed or meaningfully advanced — current phase/step, what's done, any blockers. This is the fast way to answer "where are we" even in a brand-new session with no conversation history.
- **Always** ask before touching authentication, payment, or production data/config.

## Gotchas (anticipated — validate once building starts)
- Gmail API quotas are per-project and per-user; backlog processing for a new user can burn quota fast — batch and throttle deliberately.
- Google OAuth apps requesting `gmail.modify` require a verification review before scaling past ~100 test users — this has nothing to do with code quality and can't be rushed; start the process early.
- Label writes are not truly idempotent by default — always check current label state before re-applying to avoid duplicate/conflicting labels on retry.
- `.env` files are easy to accidentally commit the first time — the `.gitignore` was set up before the first commit specifically to prevent this; don't remove those lines.
