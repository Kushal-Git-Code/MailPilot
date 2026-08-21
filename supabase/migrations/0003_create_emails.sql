-- emails: metadata + classification results only.
-- No body, snippet, sender, or subject column — zero email content stored, ever.
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text not null,
  priority_flagged boolean not null default false,
  category text,
  classification_reason text,
  confidence numeric,
  user_corrected boolean not null default false,
  processed_at timestamptz,
  received_at timestamptz not null
);

create index if not exists emails_user_id_processed_at_idx
  on public.emails (user_id, processed_at desc);

create index if not exists emails_user_id_priority_flagged_idx
  on public.emails (user_id, priority_flagged);
