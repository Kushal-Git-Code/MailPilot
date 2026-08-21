# Implementation Plan — MailPilot (Phase 1)

Numbered, dependency-ordered build sequence. The app should compile and run after every single step — no step should leave the project in a broken state. Each step is sized [S/M/L]. This is what you hand to Claude Code, one step (or a few small ones) at a time, waiting for a "go" between them per the Implementation Plan prompt pattern.

---

## Phase 1: Project Setup

1. **[S]** Scaffold Next.js 14 app in `/web` (TypeScript, Tailwind, App Router) per `docs/trd.md` folder structure. Verify `npm run dev` runs and shows a blank page.
2. **[S]** Scaffold standalone `/worker` Node/TypeScript service with a minimal "hello world" entry point. Verify it runs independently.
3. **[S]** Create `/shared` folder with a placeholder types file both `/web` and `/worker` can import from.
4. **[S]** Add `.env.example` listing every variable from `docs/trd.md` (names only). Confirm `.gitignore` covers `.env`.
5. **[M]** Set up Supabase project (via dashboard, not code) — get `DATABASE_URL`, `SUPABASE_URL`, keys. Confirm `/web` can connect with a trivial test query.
6. **Done criteria:** both `/web` and `/worker` run locally, environment variables are documented, Supabase connection confirmed. Nothing user-facing yet.

---

## Phase 2: Database Schema

7. **[M]** Write Postgres migrations for all 5 tables in `docs/backend-schema.md` (`users`, `gmail_tokens`, `emails`, `rules`, `audit_log`) — exact columns, types, foreign keys, indexes as specified. **No `body`, `snippet`, `sender`, or `subject` columns anywhere.**
8. **[M]** Apply Row Level Security policies per the schema doc — `user_id = auth.uid()` on every table.
9. **[S]** Seed one test row per table manually, read it back, confirm RLS blocks cross-user access (test with two different auth contexts).
10. **Done criteria:** schema matches `docs/backend-schema.md` exactly, RLS verified working, rollback script exists for each migration.

---

## Phase 3: Authentication

11. **[M]** Implement Supabase Auth (email + Google) for app login in `/web`. Protected route middleware redirects unauthenticated users to `/login`.
12. **[L]** Implement the **separate** Google OAuth flow for Gmail access (`gmail.readonly` + `gmail.modify` scopes) — this is distinct from Supabase Auth login. Store encrypted tokens in `gmail_tokens` per the schema. Flag: this requires a Google Cloud project + OAuth consent screen configured outside of code first.
13. **[S]** Implement Gmail disconnect flow — revokes token, sets `gmail_tokens.status = 'revoked'`, redirects per `docs/app-flow.md`.
14. **Done criteria:** a real user can sign up, log in, connect Gmail, disconnect Gmail, and reconnect — all matching the Auth Flow in `docs/app-flow.md`.

---

## Phase 4: Core Feature — Backlog Onboarding & Date Range

15. **[S]** Build `/onboarding/connect` and `/onboarding/backlog` pages per `docs/app-flow.md` and `docs/ui-ux-brief.md` (design tokens from the brief, not default styling).
16. **[M]** Backend endpoint that kicks off a backlog classification job (BullMQ) scoped to the user's chosen date range, enqueued to the worker.
17. **Done criteria:** connecting Gmail and picking a date range successfully enqueues a job — verified by checking the queue, even before classification logic exists.

---

## Phase 5: Core Feature — Classification Pipeline

18. **[M]** In `/worker`, build the Gmail fetch function — batched API calls (per the finalized performance strategy in `docs/trd.md`), pulling message IDs + metadata for the target date range.
19. **[L]** Build the Claude API classification call — structured prompt, JSON output (priority, category, reason, confidence) validated with `zod`. Build the `/evals` folder with 20-30 labeled test emails before trusting this.
20. **[M]** Run classification results against `/evals`, iterate on the prompt until precision/recall is acceptable. Do not proceed until this is genuinely reviewed, not just "looks fine."
21. **[M]** Write classification results to the `emails` table (no content, per schema) and write the corresponding `audit_log` entry.
22. **[M]** Implement the single `MailPilot/Priority` Gmail label application — idempotent (check current label state before applying).
23. **[S]** Enforce the 75/day free tier cap server-side in the worker — queue overflow as "resumes tomorrow," never silently drop.
24. **Done criteria:** connecting a real (test) Gmail account and picking a date range results in correctly labeled emails in Gmail and correct rows in the `emails`/`audit_log` tables, with zero content ever written.

---

## Phase 6: Core Feature — Dashboard

25. **[M]** Build `/dashboard` — flagged-priority list view, per `docs/ui-ux-brief.md` (single focal action, restrained palette, designed empty state).
26. **[M]** Implement batched live Gmail fetch + in-memory session cache for sender/subject display (per the finalized performance strategy) — verify no data is written to Postgres or Redis at any point.
27. **[S]** Build `/dashboard/all` secondary category view.
28. **[M]** Implement manual correction control (US-3) — updates label + writes `audit_log` entry immediately.
29. **[M]** Implement undo (US-5) — reverses the most recent `audit_log` entry for an email, respecting the 30-day `reversible_until` window.
30. **Done criteria:** every user story in `docs/prd-gmail-triage.md` (US-1 through US-5) is functionally demonstrable end to end.

---

## Phase 7: Core Feature — Settings

31. **[S]** Build `/settings/account` (profile, connected Gmail, disconnect).
32. **[M]** Build `/settings/categories` — user-customizable classification categories (US-2 requirement), feeding into the `rules` table.
33. **[S]** Build `/settings/plan` — shows daily usage against the 75/day cap.
34. **[S]** Build the full sidebar nav with "Coming soon" muted state for unbuilt sections, per `docs/ui-ux-brief.md`.
35. **Done criteria:** settings pages match `docs/app-flow.md` page list; nav matches the design brief exactly.

---

## Phase 8: UI Polish

36. **[S]** Apply motion (fade/slide on classification) per `docs/ui-ux-brief.md`.
37. **[S]** Verify WCAG AA contrast on the sage green accent against cream background; adjust if needed (flagged as unverified in the design brief).
38. **[M]** Mobile responsiveness pass across all pages.
39. **[S]** Build and polish all empty/error states listed in `docs/app-flow.md` — no generic "no data" or raw error messages anywhere.

---

## Phase 9: Testing

40. **[M]** Unit tests for classification parsing, label idempotency logic, free-tier cap enforcement.
41. **[L]** Playwright E2E tests for the money paths: sign up → connect Gmail → backlog onboarding → dashboard shows correct labels → correction → undo. Include one unhappy path (OAuth denial, classification API failure).
42. **[M]** Run the security audit prompt (#09 from your reference list) — focus areas: OAuth token handling, RLS correctness, rate limiting on the classification endpoint. Fix critical findings before proceeding.
43. **Done criteria:** E2E suite passes in CI (GitHub Actions), security audit findings addressed or explicitly ticketed.

---

## Phase 10: Deployment

44. **[M]** Deploy `/web` to Vercel, `/worker` + Redis to Railway, confirm Supabase production instance is separate from dev.
45. **[S]** Configure production environment variables (never copy dev secrets into prod as a shortcut).
46. **[M]** Submit Google OAuth app for verification review (should have been started back in Phase 3 in parallel — confirm status here, this gates real-user launch beyond test accounts).
47. **Done criteria:** MailPilot is live, a real (non-test) Google account can complete the full flow, OAuth verification is either approved or in-progress with test-user limits understood.

---

## What "Finished" (v1) Looks Like

All 5 PRD user stories work end-to-end, in production, with:
- Zero email content of any kind stored in the database (verified against the schema, not just claimed)
- Google OAuth verification submitted/approved
- Free tier cap enforced
- E2E tests passing in CI
- Security audit completed with critical items resolved

Smart Unsubscribe (Phase 2) is explicitly out of this plan — begins only after the above is live and stable.
