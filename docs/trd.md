# TRD — Technical Requirements Document — MailPilot (Phase 1)

---

## Stack

| Layer | Choice |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Backend (user-facing API)** | Next.js API routes (Route Handlers) — handles OAuth callback, dashboard data, settings. Kept inside the Next.js app rather than a separate service, since these are fast, short-lived requests. |
| **Backend (background worker)** | Standalone Node.js service (TypeScript) — handles Gmail polling, calling Claude API for classification, and writing Gmail labels. Runs separately from the web app because these are longer-running jobs that shouldn't run inside serverless function time limits. |
| **Database** | PostgreSQL via Supabase |
| **Auth** | Supabase Auth (app login: email + Google) — separate and distinct from the Gmail OAuth connection, which is its own token flow scoped to `gmail.readonly` + `gmail.modify` |
| **Job Queue** | BullMQ + Redis (Redis hosted via Railway or Upstash) |
| **Hosting** | Vercel (Next.js frontend + API routes) · Railway (worker service + Redis) · Supabase (Postgres) |
| **LLM** | Claude API (Anthropic) — start with a smaller/cheaper model for classification; only move to a larger model if the eval set shows it's needed |

---

## Third-Party APIs & Services

| Service | Purpose | Tier |
|---|---|---|
| Gmail API | Read emails, apply labels, manage watch/push (Phase 1.1) | Free (Google Cloud quota-based) |
| Google OAuth 2.0 | User consent for Gmail access | Free |
| Claude API (Anthropic) | Email classification | Paid, usage-based |
| Supabase | Postgres DB + app auth | Free tier to start, paid as usage grows |
| Railway | Worker service + Redis hosting | Paid (usage-based) |
| Vercel | Frontend + API route hosting | Free tier to start |

---

## Key Libraries

- `@supabase/supabase-js` — DB client + auth
- `googleapis` — official Google API Node client (Gmail, OAuth)
- `@anthropic-ai/sdk` — Claude API client
- `bullmq` + `ioredis` — job queue
- `zod` — runtime schema validation (API inputs, Claude's JSON classification output)
- `date-fns` — date handling (backlog date-range selection)
- Testing: `vitest` or `jest` (unit), `@playwright/test` (E2E, per prompt #11 from your reference list)

---

## Folder Structure & Naming Conventions

```
MailPilot/
├── CLAUDE.md
├── .gitignore
├── docs/                    # the 6 planning documents
├── web/                     # Next.js app (frontend + API routes)
│   ├── app/                 # App Router pages
│   ├── components/
│   ├── lib/                 # shared utilities, Supabase client, types
│   └── app/api/             # Route Handlers (OAuth callback, dashboard endpoints)
├── worker/                  # standalone Node worker service
│   ├── src/
│   │   ├── jobs/            # BullMQ job definitions (poll, classify, label)
│   │   ├── gmail/           # Gmail API wrapper functions
│   │   └── classification/  # Claude prompt + parsing logic
│   └── package.json
├── shared/                  # types shared between web/ and worker/ (e.g. classification schema)
└── evals/                   # labeled test emails + expected classifications
```

**Naming conventions:** kebab-case for files/folders, PascalCase for React components, camelCase for functions/variables. Database tables/columns: snake_case (Postgres convention).

---

## Environment Variables

*(names only — actual values go in `.env`, never committed; `.env.example` should list these with placeholder values)*

- `DATABASE_URL`
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`
- `ANTHROPIC_API_KEY`
- `REDIS_URL`
- `TOKEN_ENCRYPTION_KEY` (for encrypting stored Gmail refresh tokens at rest)

---

## Hard Technical Constraints

- **No email content persistence** — enforced at the query/schema level (see `docs/backend-schema.md` — no `body`/`snippet` column exists at all, not just "unused").
- Must respect Gmail API rate limits — backoff/retry logic required in the worker, not naive retry loops.
- Google OAuth verification review (for `gmail.modify` scope) must be started as soon as the OAuth consent screen is finalized — this is a process constraint, not a code constraint, but it gates real-user launch.
- Free tier cap (75 emails/day) enforced server-side in the worker, not just as a UI suggestion.
- Every Gmail write action must be idempotent and logged to `audit_log` before/alongside execution.

---

## Phase 2 Note (not built now, architecture should not block it later)

Smart Unsubscribe will need: access to email headers (`List-Unsubscribe`, `List-Unsubscribe-Post`) during the same backlog/poll scan already being built for triage, and a new `subscriptions` table. No architectural changes anticipated to accommodate this later — the worker's email-scanning pipeline is designed to be extended, not rebuilt.
