# Progress Log — MailPilot

## Current Status
Last updated: 2026-08-21
Currently on: Phase 3, Step 11 — implement Supabase Auth (email + Google) for app login in `/web`, with protected route middleware

## Completed
- [x] Phase 1: Project Setup (Steps 1-6) — `/web` and `/worker` scaffolded, `/shared` wired into both, `.env.example` documented, Supabase project created and connection verified
- [x] Phase 2: Database Schema (Steps 7-9) — complete
  - Step 7: migrations for all 5 tables (`users`, `gmail_tokens`, `emails`, `rules`, `audit_log`) written, applied, and verified against the live DB — including a real up/down/up rollback test, not just written and assumed correct
  - Step 8: RLS enabled + 20 policies (4 per table, `auth.uid()`-scoped) written in `0006_enable_rls.sql`, applied, and verified against live Postgres system catalogs. Caught and fixed a real bug: `CREATE POLICY` isn't idempotent, which broke a second `npm run migrate` run — fixed with `DROP POLICY IF EXISTS` before each `CREATE POLICY`. Rollback tested in isolation (single-file run, not full `migrate:down`, since that would also drop the tables from 0001-0005) — confirmed it disables RLS and removes all 20 policies without touching the tables, then reapplied to restore.
  - Step 9: seeded 1 row per table for two temporary auth users, verified cross-user RLS via real authenticated sessions (anon key + login, not the superuser DATABASE_URL connection, which bypasses RLS and can't actually test it) — User A could insert/see only their own rows across all 5 tables, an explicit query for User B's rows came back empty (not an error) on every table. Test users and rows cleaned up afterward (cascade delete), verified 0 rows remain in all 5 tables.
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
- `migrate.mjs` has no applied-migrations tracking — every `npm run migrate` re-runs all up-files from scratch, so each one must stay idempotent (`CREATE TABLE IF NOT EXISTS`, `DROP POLICY IF EXISTS` before `CREATE POLICY`, etc.) or a second run will break. `migrate:down` rolls back *everything* in reverse, including table drops — to test/undo a single migration in isolation, run that one file directly instead (see how the 0006 RLS rollback was tested).
- Important gotcha for any future RLS testing: the `DATABASE_URL` connection (via `pg`, used by `migrate.mjs`) runs as the `postgres` role, which **bypasses RLS entirely** — it's the right tool for schema changes, the wrong tool for proving RLS actually blocks anything. Real RLS tests need the `anon` key + a real authenticated session (`supabase.auth.signInWithPassword`), the same access path the real app uses.
- Claude Code plugins installed: `typescript-lsp`, `pr-review-toolkit`, `supabase` (MCP, OAuth-authenticated — broad org-level scope: `projects:write`, `database:write`, `secrets:read`, etc.), and `github` (MCP — required installing the `gh` CLI via winget first, then `gh auth login`). Standing preference: never invoke a newly available plugin tool/agent without asking first, even after it's installed/authenticated — see memory `feedback_ask_before_new_plugin_tools`. In practice, prefer the narrowest-scoped credential for a task (e.g. project-scoped `DATABASE_URL`/anon key over the account-wide Supabase MCP) unless there's a specific reason to reach for the broader one.
- Guardrail hooks are in `.claude/settings.json` + `.claude/hooks/` (protect-paths.mjs, lint-typecheck.mjs) — but hook config is snapshotted at Claude Code session startup, so changes made mid-session won't govern that same session's own tool calls. A fresh session is needed for them to actually take effect live (both were unit-tested directly and work correctly in isolation, independent of this caveat).
