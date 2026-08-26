-- Two new classifier signals (worker/src/classification/classify.ts),
-- validated against /evals before being added here -- power the dashboard's
-- action-oriented buckets (Has Deadlines / Quick Replies), splitting what
-- was previously one undifferentiated "Needs Your Attention" bucket.
-- default false + backfill-safe: existing rows never had these fields
-- computed, so they correctly fall back to the broadest "Needs Your
-- Attention" bucket until reclassified, never to a wrong specific one.
alter table public.emails
  add column if not exists has_deadline boolean not null default false;

alter table public.emails
  add column if not exists quick_reply_candidate boolean not null default false;
