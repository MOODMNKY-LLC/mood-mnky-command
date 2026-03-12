-- Multi-tenant Supabase (MT) — platform-level roles and first-user bootstrap.
-- Purpose: platform_role on profiles (platform_admin, platform_moderator, user, pending)
-- so backoffice/admin access is independent of tenant membership. First authenticated
-- user becomes platform_admin. Run only against the MT Supabase project.

set search_path = '';

-- =============================================================================
-- profiles: add platform_role
-- =============================================================================
alter table public.profiles
  add column if not exists platform_role text not null default 'user'
  check (platform_role in ('platform_admin', 'platform_moderator', 'user', 'pending'));

comment on column public.profiles.platform_role is
  'App-level role: platform_admin (full backoffice), platform_moderator (limited), user (normal), pending (invited/not approved). Independent of tenant membership.';

-- =============================================================================
-- Helper: is_platform_admin(user_id)
-- =============================================================================
create or replace function public.is_platform_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.platform_role = 'platform_admin'
  );
$$;

comment on function public.is_platform_admin(uuid) is
  'True if the user has platform_admin role; use for backoffice and /admin access.';

-- =============================================================================
-- Helper: is_platform_moderator_or_admin(user_id)
-- =============================================================================
create or replace function public.is_platform_moderator_or_admin(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = p_user_id and p.platform_role in ('platform_admin', 'platform_moderator')
  );
$$;

comment on function public.is_platform_moderator_or_admin(uuid) is
  'True if the user has platform_admin or platform_moderator; for future moderator-scoped features.';

-- =============================================================================
-- Trigger: first user becomes platform_admin
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_admin boolean;
begin
  select not exists (
    select 1 from public.profiles where platform_role = 'platform_admin'
  ) into first_admin;

  insert into public.profiles (id, display_name, platform_role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    case when first_admin then 'platform_admin' else 'user' end
  );
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates profile on signup; assigns platform_admin to the first user, user for everyone else.';

-- =============================================================================
-- Backfill: if no platform_admin exists, assign to earliest user (id from profiles)
-- =============================================================================
update public.profiles
set platform_role = 'platform_admin'
where id = (
  select p.id from public.profiles p
  order by p.created_at asc
  limit 1
)
and not exists (select 1 from public.profiles where platform_role = 'platform_admin');
