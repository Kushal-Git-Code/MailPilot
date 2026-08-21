-- gmail_tokens: encrypted OAuth tokens for Gmail access, 1:1 with a user.
-- access_token / refresh_token are encrypted at the application layer
-- (TOKEN_ENCRYPTION_KEY) before insert — this column just stores text.
create table if not exists public.gmail_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  gmail_address text not null,
  connected_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'revoked', 'error'))
);
