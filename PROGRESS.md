# Progress Log — MailPilot

## Current Status
Last updated: 2026-08-21
Currently on: Phase 2, Step 8 — Apply Row Level Security policies per `docs/backend-schema.md` (`user_id = auth.uid()` on every table)

## Completed
- [x] Phase 1: Project Setup (Steps 1-6) — `/web` and `/worker` scaffolded, `/shared` wired into both, `.env.example` documented, Supabase project created and connection verified
- [ ] Phase 2: Database Schema (Steps 7-10) — in progress
  - [x] Step 7: migrations for all 5 tables (`users`, `gmail_tokens`, `emails`, `rules`, `audit_log`) written, applied, and verified against the live DB — including a real up/down/up rollback test, not just written and assumed correct
  - [ ] Step 8: RLS policies — not started
  - [ ] Step 9: seed + cross-user RLS test — not started
- [ ] Phase 3: Authentication (Steps 11-14) — not started
- [ ] Phase 4: Core Feature — Backlog Onboarding & Date Range (Steps 15-17) — not started
- [ ] Phase 5: Core Feature — Classification Pipeline (Steps 18-24) — not started
- [ ] Phase 6: Core Feature — Dashboard (Steps 25-30) — not started
- [ ] Phase 7: Core Feature — Settings (Steps 31-35) — not started
- [ ] Phase 8: UI Polish (Steps 36-39) — not started
- [ ] Phase 9: Testing (Steps 40-43) — not started
- [ ] Phase 10: Deployment (Steps 44-47) — not started

## Open Issues / Blockers
- Google OAuth verification review (needed for `gmail.modify` scope) has not been started yet. Per `docs/trd.md` and `docs/implementation-plan.md`, this should begin as soon as the OAuth consent screen is finalized (Phase 3) — it's a slow external Google review process, not a code task, and gates real-user launch in Phase 10.
- Supabase DB password and API keys were rotated once (2026-08-21) after being inadvertently surfaced in a chat session during setup. `web/.env.local` holds the current, rotated values.

## Notes for Next Session
- Migrations live in `/supabase/migrations` as paired up/rollback SQL files (e.g. `0001_create_users.sql` + `0001_create_users_rollback.sql`), applied via `npm run migrate` / `npm run migrate:down` in `/web` (script: `web/scripts/migrate.mjs`), using `DATABASE_URL` from `web/.env.local`.
- `/shared` is wired into `/web` and `/worker` as a local `file:` dependency (`"shared": "file:../shared"` in each `package.json`) — currently just a placeholder type-only import (`Placeholder`), verified resolvable in both. Real shared types (the classification schema) land in Phase 5.
- `web/.env.local` holds real Supabase credentials and is gitignored (confirmed via `git check-ignore`, both root and `web/.gitignore` cascade correctly). If `DATABASE_URL`'s password contains special characters, they must be percent-encoded (`@`→`%40`, `%`→`%25`, `^`→`%5E`, `&`→`%26`, `(`→`%28`, `$`→`%24`, `)`→`%29`) or the connection string won't parse.
- Working pattern established this project: every step gets explained before starting, executed, verified (often with a throwaway test script that's deleted afterward), then committed locally — pushed to GitHub only after explicit go-ahead. Destructive actions (e.g. `migrate:down` against the real DB) are confirmed with the user first, even when low-risk.
