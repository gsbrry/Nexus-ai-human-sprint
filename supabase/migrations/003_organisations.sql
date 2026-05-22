-- 003_organisations.sql
-- Tenant root. Every org-scoped record points back to organisations(id).

begin;

create table public.organisations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        citext not null unique,
  logo_url    text,
  settings    jsonb not null default '{}'::jsonb,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index organisations_slug_idx on public.organisations (slug) where deleted_at is null;
create index organisations_deleted_at_idx on public.organisations (deleted_at);

create trigger trg_organisations_updated_at
  before update on public.organisations
  for each row execute function public.set_updated_at();

alter table public.organisations enable row level security;

-- Policies are defined in 004_org_members.sql once helper functions exist.

commit;
