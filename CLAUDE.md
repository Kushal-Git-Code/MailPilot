# CLAUDE.md — MailPilot

> **Note:** No codebase exists yet, so this was written by hand from project decisions, not scanned from code. Once the initial scaffold exists, re-run the "Create Your CLAUDE.md" prompt (scan the codebase) to catch drift between what was intended here and what actually got built — then merge the results.

## What this project is
MailPilot is an AI email assistant that connects to a user's Gmail account and automatically triages incoming mail — classifying by priority/category and applying a single `MailPilot/Priority` label to what needs attention — so the user spends less time on manual sorting. Phase 1 = triage only. Phase 2 (not yet in scope) = Smart Unsubscribe (subscription scanner, bulk unsubscribe, mute). No reply drafting, no voice assistant planned currently.

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
- **Never store email body content, snippets, sender, subject, or attachments in the database — ever, under any circumstance.** Only IDs, classification results, and timestamps are persisted. Sender, subject, and any preview text are fetched live from the Gmail API at render time, using the stored `gmail_message_id` — never cached or written to Postgres. This is a core product trust commitment, not a performance decision — do not "optimize" it away by adding caching later without explicit approval.
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
