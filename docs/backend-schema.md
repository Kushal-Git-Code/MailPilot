# Backend Schema — MailPilot (Phase 1)

**Auth Provider:** Supabase Auth (JWT-based) — email + Google OAuth for app login. Gmail data-access OAuth is a **separate** token flow, stored in `gmail_tokens`, not to be confused with the login provider.
**Row Level Security:** Enabled on every table below — a user can only read/write their own rows, enforced at the database level, not just in application code.

---

## Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | Matches Supabase Auth user id |
| `email` | text | |
| `created_at` | timestamptz | |
| `plan` | text | `free` (only tier in v1) |
| `daily_email_count` | integer | Resets daily, enforces the 75/day cap server-side |
| `daily_count_reset_at` | timestamptz | Used to determine when to reset `daily_email_count` |

### `gmail_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | 1:1 with user |
| `access_token` | text, **encrypted** | Encrypted at the application layer using `TOKEN_ENCRYPTION_KEY` before storage — never stored plaintext |
| `refresh_token` | text, **encrypted** | Same as above |
| `token_expires_at` | timestamptz | |
| `gmail_address` | text | The connected Gmail address (for display in Settings) |
| `connected_at` | timestamptz | |
| `status` | text | `active` / `revoked` / `error` — set to `revoked` if a Gmail API call fails auth, triggering the reconnect flow in App Flow |

### `emails`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `gmail_message_id` | text | Gmail's own message ID — the only pointer back to the actual email. **No content field of any kind exists in this table** — not body, not snippet, not sender, not subject. |
| `gmail_thread_id` | text | |
| `priority_flagged` | boolean | Whether `MailPilot/Priority` label was applied |
| `category` | text | User-customizable category assigned |
| `classification_reason` | text | The one-line reason shown in the dashboard (Claude's short output about *why* — e.g. "looks like a direct question from a colleague" — not a quote or excerpt of the email itself) |
| `confidence` | numeric | Optional — classification confidence score if the model returns one |
| `user_corrected` | boolean | True if the user manually overrode the classification |
| `processed_at` | timestamptz | |
| `received_at` | timestamptz | Gmail's own received timestamp |

**Dashboard display note:** sender name/address and subject line are fetched live from the Gmail API at render time, using `gmail_message_id` — never persisted here. Performance is handled via batched Gmail API calls (one request for all visible emails, not one per email) plus an in-memory, per-session cache held in server RAM only — never Redis, never Postgres, never disk. See `docs/trd.md` for the full performance strategy.

*Index:* `(user_id, processed_at DESC)` — dashboard's primary query pattern. `(user_id, priority_flagged)` — for the "Priority" filtered view.

### `rules`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `rule_type` | text | e.g. `category_definition`, `sender_override`, `correction_signal` |
| `rule_data` | jsonb | Flexible structure — e.g. custom category name + description, or "always mark sender X as priority" |
| `created_at` | timestamptz | |
| `active` | boolean | |

*Index:* `(user_id, rule_type)`

### `audit_log`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `user_id` | uuid, FK → `users.id` | |
| `email_id` | uuid, FK → `emails.id`, nullable | Null for non-email-specific actions |
| `action` | text | e.g. `label_applied`, `label_removed`, `correction_made` |
| `previous_state` | jsonb | For reversal — what it was before |
| `new_state` | jsonb | What it changed to |
| `reversible_until` | timestamptz | `created_at` + 30 days, per the undo requirement in the PRD |
| `created_at` | timestamptz | |

*Index:* `(user_id, created_at DESC)`

---

## Relationships

- `gmail_tokens.user_id → users.id` (one-to-one)
- `emails.user_id → users.id` (many-to-one)
- `rules.user_id → users.id` (many-to-one)
- `audit_log.user_id → users.id` (many-to-one)
- `audit_log.email_id → emails.id` (many-to-one, nullable)

---

## Row Level Security

- Every table: `user_id = auth.uid()` policy for SELECT/INSERT/UPDATE/DELETE — a user can only ever see or modify their own data.
- The worker service (background jobs) uses the Supabase **service role key** (bypasses RLS, since it acts on behalf of many users) — this key must never be exposed to the frontend, only used server-side in the worker.

## User Roles

Single role in v1: `user`. No admin/multi-tenant roles needed for Phase 1 — this is a single-user-per-account product, not a team tool.

## Sensitive Fields

- `gmail_tokens.access_token` / `refresh_token` — encrypted at rest (application-layer encryption before insert, decrypted only in-memory when needed for an API call).
- No other genuinely sensitive fields exist in this schema, by design — this is the direct structural result of the "zero email content stored" decision, applied fully: no body, no snippet, **no sender, no subject**. The `emails` table holds only IDs, classification results, and timestamps. There is nothing in this database that reveals what any email actually says or who it's from — that information only ever exists transiently (in Claude's classification call, and in the live Gmail API fetch that powers the dashboard) and is never written to disk.

## File/Media Storage

None in Phase 1. No attachments, avatars, or uploads are part of this product's scope yet.

## Webhooks / Event Triggers

None in v1 (polling-based). Phase 1.1 (real-time push) would add a webhook endpoint receiving Google Cloud Pub/Sub notifications — not built now, but the `emails` table design doesn't need to change to support it later.

---

## API Endpoint List (high-level, detailed contracts belong in each feature's spec — see prompt #04 pattern)

- `POST /api/auth/gmail/callback` — OAuth callback, stores tokens
- `GET /api/dashboard/priority` — flagged emails for the logged-in user
- `GET /api/dashboard/all` — all classified emails, grouped by category
- `POST /api/emails/:id/correct` — user corrects a classification
- `POST /api/emails/:id/undo` — reverses the most recent action on this email
- `GET /api/settings/categories` / `POST /api/settings/categories` — manage custom categories
- `POST /api/gmail/disconnect` — revokes token, sets `gmail_tokens.status = 'revoked'`
