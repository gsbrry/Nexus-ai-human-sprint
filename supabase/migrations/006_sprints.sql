-- 006_sprints.sql
-- Sprints belong to a project. org_id is DENORMALISED for fast RLS.

begin;

create table public.sprints (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organisations(id) on delete cascade,
  project_id      uuid not null references public.projects(id) on delete cascade,
  name            text not null,
  goal            text,
  start_date      date not null,
  end_date        date not null,
  status          sprint_status not null default 'planned',
  capacity_points integer default 0,
  sprint_number   integer not null default 1,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz,
  deleted_at      timestamptz,
  check (end_date >= start_date)
);

create index sprints_org_id_idx on public.sprints (org_id) where deleted_at is null;
create index sprints_project_id_idx on public.sprints (project_id) where deleted_at is null;
create index sprints_status_idx on public.sprints (project_id, status) where deleted_at is null;
create unique index sprints_one_active_per_project on public.sprints (project_id)
  where status = 'active' and deleted_at is null;

create trigger trg_sprints_updated_at
  before update on public.sprints
  for each row execute function public.set_updated_at();

-- Enforce that sprint.org_id matches the parent project.org_id.
create or replace function public.enforce_sprint_org_match()
returns trigger
language plpgsql
as $$
declare
  v_proj_org uuid;
begin
  select org_id into v_proj_org from public.projects where id = new.project_id;
  if v_proj_org is null then
    raise exception 'Project % not found', new.project_id;
  end if;
  if new.org_id is null then
    new.org_id := v_proj_org;
  elsif new.org_id <> v_proj_org then
    raise exception 'sprint.org_id (%) must match project.org_id (%)', new.org_id, v_proj_org;
  end if;
  return new;
end;
$$;

create trigger trg_sprints_org_match
  before insert or update on public.sprints
  for each row execute function public.enforce_sprint_org_match();

alter table public.sprints enable row level security;

create policy "sprints_select_org_members"
  on public.sprints for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "sprints_insert_sm_or_above"
  on public.sprints for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "sprints_update_sm_or_above"
  on public.sprints for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

create policy "sprints_no_delete"
  on public.sprints for delete using (false);

commit;
