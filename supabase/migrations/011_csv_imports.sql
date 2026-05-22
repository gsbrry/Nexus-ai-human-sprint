-- 011_csv_imports.sql
-- Tracks each CSV upload → JSON → bulk-insert flow, with row-level errors retained.

begin;

create table public.csv_imports (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organisations(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  sprint_id    uuid references public.sprints(id) on delete set null,
  file_name    text not null,
  file_size    integer,
  row_count    integer default 0,
  rows_imported integer default 0,
  status       csv_import_status not null default 'pending',
  errors       jsonb not null default '[]'::jsonb,
  raw_json     jsonb,            -- the final JSON the user submitted
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create index csv_imports_org_idx on public.csv_imports (org_id, created_at desc);
create index csv_imports_user_idx on public.csv_imports (user_id);

alter table public.csv_imports enable row level security;

create policy "csv_imports_select_org_sm"
  on public.csv_imports for select
  using (public.is_org_sm_or_above(org_id) or public.is_super_admin());

create policy "csv_imports_insert_org_sm"
  on public.csv_imports for insert
  with check (public.is_org_sm_or_above(org_id));

create policy "csv_imports_update_org_sm"
  on public.csv_imports for update
  using (public.is_org_sm_or_above(org_id))
  with check (public.is_org_sm_or_above(org_id));

create policy "csv_imports_no_delete"
  on public.csv_imports for delete using (false);

commit;
