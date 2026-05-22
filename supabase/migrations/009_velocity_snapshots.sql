-- 009_velocity_snapshots.sql
-- Daily-rolling velocity records per sprint per user, written by the sprint-completion job.

begin;

create table public.velocity_snapshots (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organisations(id) on delete cascade,
  project_id        uuid not null references public.projects(id) on delete cascade,
  sprint_id         uuid not null references public.sprints(id) on delete cascade,
  user_id           uuid references public.profiles(id) on delete set null,
  points_committed  integer not null default 0,
  points_completed  integer not null default 0,
  tasks_committed   integer not null default 0,
  tasks_completed   integer not null default 0,
  snapshot_date     date not null default current_date,
  created_at        timestamptz not null default now(),
  unique (sprint_id, user_id, snapshot_date)
);

create index velocity_org_project_idx on public.velocity_snapshots (org_id, project_id);
create index velocity_sprint_idx on public.velocity_snapshots (sprint_id);
create index velocity_user_idx on public.velocity_snapshots (user_id);

alter table public.velocity_snapshots enable row level security;

create policy "velocity_select_org_members"
  on public.velocity_snapshots for select
  using (public.is_org_member(org_id) or public.is_super_admin());

-- Writes happen via the service-role server context (sprint completion job).
create policy "velocity_no_client_write"
  on public.velocity_snapshots for insert with check (false);
create policy "velocity_no_client_update"
  on public.velocity_snapshots for update using (false);

commit;
