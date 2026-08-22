-- Prevents duplicate rows for the same Gmail message if a job retries —
-- per the "Duplicate processing must be idempotent" edge case in the PRD.
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS, so this is wrapped in a
-- guard to keep the migration safe to re-run (see the 0006 RLS gotcha).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'emails_user_gmail_message_unique'
  ) then
    alter table public.emails
      add constraint emails_user_gmail_message_unique unique (user_id, gmail_message_id);
  end if;
end $$;
