-- 016_telegram_updates.sql
--
-- Replay guard for the Telegram webhook. Telegram legitimately retries a
-- delivery, and an attacker can replay a captured one, so each update_id is
-- recorded once per org and a repeat is dropped as a no-op.
--
-- Server-only, like org_integrations: RLS on, no policies, grants revoked.
begin;

create table public.telegram_updates (
  org_id     uuid not null references public.organisations(id) on delete cascade,
  update_id  bigint not null,
  created_at timestamptz not null default now(),
  primary key (org_id, update_id)
);

-- Lets a cleanup job prune anything older than Telegram's own retry window.
create index telegram_updates_created_at_idx on public.telegram_updates (created_at);

alter table public.telegram_updates enable row level security;
revoke all on public.telegram_updates from anon, authenticated;

commit;
