-- 015_org_integrations.sql
--
-- Per-workspace integration secrets, so Raphy never has to put an Anthropic key
-- or a Telegram bot token in the deployment environment. Users add their own in
-- Settings and the platform works without them.
--
--   · Anthropic key  -> profiles.anthropic_api_key (per user, locked in 014)
--   · Telegram bot   -> org_integrations           (per org, locked here)
--
-- Storing the bot token in organisations.settings was rejected: every org member
-- can select that row, so any member could read the token. This table has NO
-- policies, so no client role reaches it at all; only service_role (which
-- bypasses RLS) can, and only from a server route.
begin;

create table public.org_integrations (
  org_id                  uuid primary key references public.organisations(id) on delete cascade,
  telegram_bot_token      text,
  telegram_webhook_secret text,
  updated_by              uuid references public.profiles(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_org_integrations_updated_at
  before update on public.org_integrations
  for each row execute function public.set_updated_at();

alter table public.org_integrations enable row level security;
-- Deliberately no policies: RLS with zero policies denies every client role.
revoke all on public.org_integrations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Status surfaces: "is a key configured?" without ever exposing the secret
-- ---------------------------------------------------------------------------

create or replace view public.org_integrations_status as
select
  oi.org_id,
  (oi.telegram_bot_token is not null and oi.telegram_bot_token <> '') as has_telegram_bot_token,
  oi.updated_at
from public.org_integrations oi
where public.is_org_member(oi.org_id);

grant select on public.org_integrations_status to authenticated;

-- SECURITY DEFINER so the caller can learn whether their own key is set without
-- holding select on the revoked column.
create or replace function public.has_anthropic_key()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(p.anthropic_api_key, '') <> ''
  from public.profiles p
  where p.id = auth.uid();
$$;

grant execute on function public.has_anthropic_key() to authenticated;

commit;
