-- 005_projects.sql
-- Projects belong to a single organisation. Soft delete only.

begin;

create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  name          text not null,
  key           text not null,  -- e.g. 'GBM' — used to prefix task_key
  description   text,
  status        project_status not null default 'active',
  color         text default '#D4A843',
  created_by    uuid references public.profiles(id) on delete set null,
  start_date    date,
  target_date   date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (org_id, key)
);

create index projects_org_id_idx on public.projects (org_id) where deleted_at is null;
create index projects_status_idx on public.projects (org_id, status) where deleted_at is null;

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects_select_org_members"
  on public.projects for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "projects_insert_sm_or_above"
  on public.projects for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "projects_update_sm_or_above"
  on public.projects for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

-- Hard DELETE never permitted from clients — use soft delete via UPDATE.
create policy "projects_no_delete"
  on public.projects for delete
  using (false);

commit;
