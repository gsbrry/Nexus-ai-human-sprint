-- 007_tasks.sql
-- Core entity. org_id denormalised. task_key auto-generated as <PROJECT_KEY>-<N>.

begin;

create table public.tasks (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organisations(id) on delete cascade,
  project_id    uuid not null references public.projects(id) on delete cascade,
  sprint_id     uuid references public.sprints(id) on delete set null,
  parent_id     uuid references public.tasks(id) on delete set null,
  task_key      text not null,   -- e.g. 'GBM-42'
  title         text not null,
  description   text,
  status        task_status not null default 'todo',
  priority      task_priority not null default 'medium',
  type          task_type not null default 'feature',
  assignee_id   uuid references public.profiles(id) on delete set null,
  reporter_id   uuid references public.profiles(id) on delete set null,
  story_points  integer,
  position      integer not null default 0,
  is_blocked    boolean not null default false,
  blocker_reason text,
  due_date      date,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,
  unique (project_id, task_key)
);

create index tasks_org_id_idx on public.tasks (org_id) where deleted_at is null;
create index tasks_project_id_idx on public.tasks (project_id) where deleted_at is null;
create index tasks_sprint_id_idx on public.tasks (sprint_id) where deleted_at is null;
create index tasks_assignee_id_idx on public.tasks (assignee_id) where deleted_at is null;
create index tasks_status_idx on public.tasks (sprint_id, status) where deleted_at is null;
create index tasks_due_date_idx on public.tasks (due_date) where deleted_at is null and status <> 'done';

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Per-project sequential counter for task_key generation.
create table public.project_task_counters (
  project_id uuid primary key references public.projects(id) on delete cascade,
  next_value bigint not null default 1
);

-- Set task_key, sync org_id with project, set completed_at on status -> done.
create or replace function public.tasks_before_insert_update()
returns trigger
language plpgsql
as $$
declare
  v_proj_org   uuid;
  v_proj_key   text;
  v_next       bigint;
begin
  -- Sync org_id with parent project
  select org_id, key into v_proj_org, v_proj_key
  from public.projects where id = new.project_id;

  if v_proj_org is null then
    raise exception 'Project % not found', new.project_id;
  end if;

  if tg_op = 'INSERT' then
    new.org_id := v_proj_org;

    -- Auto-generate task_key if blank
    if new.task_key is null or new.task_key = '' then
      insert into public.project_task_counters (project_id, next_value)
      values (new.project_id, 1)
      on conflict (project_id) do nothing;

      update public.project_task_counters
         set next_value = next_value + 1
       where project_id = new.project_id
      returning next_value - 1 into v_next;

      new.task_key := v_proj_key || '-' || v_next::text;
    end if;
  elsif new.org_id <> v_proj_org then
    raise exception 'task.org_id (%) must match project.org_id (%)', new.org_id, v_proj_org;
  end if;

  -- Stamp completed_at
  if new.status = 'done' and (old is null or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger trg_tasks_before_iu
  before insert or update on public.tasks
  for each row execute function public.tasks_before_insert_update();

alter table public.tasks enable row level security;

create policy "tasks_select_org_members"
  on public.tasks for select
  using (public.is_org_member(org_id) or public.is_super_admin());

create policy "tasks_insert_org_members"
  on public.tasks for insert
  with check (public.is_org_member(org_id));

-- Members can update tasks in their org (assigning themselves, moving status).
-- Stricter rules (e.g. only assignee can mark done) belong in the API layer.
create policy "tasks_update_org_members"
  on public.tasks for update
  using (public.is_org_member(org_id))
  with check (public.is_org_member(org_id));

create policy "tasks_no_delete"
  on public.tasks for delete using (false);

commit;
