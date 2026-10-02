-- 014_profile_visibility.sql
--
-- Two gaps found when wiring the real-data board and settings screens:
--
--   1. `profiles_self_select` (002) means a member can only read their OWN profile,
--      so assignee names and avatars came back empty on every shared screen.
--      Org members must be able to read each other's profile basics.
--
--   2. David's non-negotiable: `anthropic_api_key` must never leave the server.
--      `profiles_safe` (002) omits it, but nothing stopped a direct select of the
--      column. This revokes it at column level, so even a leaked anon/authed
--      token cannot read it — only service_role can.
begin;

-- ---------------------------------------------------------------------------
-- 1. Same-org profile visibility
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER so the lookup does not re-enter org_members RLS (which would
-- recurse through the policies added in 004).
create or replace function public.shares_org_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members me
    join public.org_members them on them.org_id = me.org_id
    where me.user_id = auth.uid()
      and me.deleted_at is null
      and them.user_id = p_user_id
      and them.deleted_at is null
  );
$$;

drop policy if exists "profiles_select_same_org" on public.profiles;
create policy "profiles_select_same_org"
  on public.profiles for select
  using (public.shares_org_with(id));

-- ---------------------------------------------------------------------------
-- 2. Lock the Anthropic key to the server
-- ---------------------------------------------------------------------------

-- Grant the readable columns explicitly, then revoke the secret one. Listing the
-- columns is required: a bare table-level grant would re-open the key.
revoke select on public.profiles from anon, authenticated;
grant select (
  id, email, full_name, avatar_url, role, telegram_chat_id,
  timezone, metadata, created_at, updated_at, deleted_at
) on public.profiles to authenticated;

-- The owner may write their own key; no role may read it back.
revoke update on public.profiles from anon, authenticated;
grant update (
  full_name, avatar_url, anthropic_api_key, telegram_chat_id,
  timezone, metadata, updated_at
) on public.profiles to authenticated;

grant select on public.profiles_safe to authenticated;

commit;
