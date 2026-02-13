-- MOOD MNKY Lab – RBAC: Add role column, first-user-as-admin, admin role updates
-- Purpose: Enable role-based access control with admin/moderator/user/pending
-- Affected: profiles table, handle_new_user function
-- Runs before funnel_tables which references profiles.role

-- ========== 1. Add role column ==========
alter table public.profiles
  add column if not exists role text not null default 'pending'
  check (role in ('admin', 'moderator', 'user', 'pending'));

-- Backfill existing rows: is_admin=true -> admin, else -> user
update public.profiles
set role = case when is_admin = true then 'admin' else 'user' end;

-- Ensure first user ever gets admin if no admin exists
update public.profiles
set role = 'admin'
where id = (select id from public.profiles order by created_at asc limit 1)
  and not exists (select 1 from public.profiles where role = 'admin');

-- Index for admin queries (e.g. listing by role)
create index if not exists idx_profiles_role on public.profiles(role);

-- ========== 2. Update handle_new_user for first-user-as-admin ==========
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
begin
  -- First user gets admin; subsequent users get pending
  select case when (select count(*) from public.profiles) = 0 then 'admin' else 'pending' end
  into new_role;

  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ========== 3. Sync is_admin with role (trigger for backward compatibility) ==========
create or replace function public.sync_is_admin_from_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_admin := (new.role = 'admin');
  return new;
end;
$$;

drop trigger if exists profiles_sync_is_admin on public.profiles;
create trigger profiles_sync_is_admin
  before insert or update of role on public.profiles
  for each row
  execute function public.sync_is_admin_from_role();

-- One-time sync for existing rows
update public.profiles set is_admin = (role = 'admin');

-- ========== 4. RLS: Admin can update any profile (including role) ==========
-- Admins need to update other users' roles. Non-admins can only update own non-role fields.
create policy "profiles_admin_update_any"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (true);

-- Note: profiles_update_owner (or equivalent) from remote_schema allows users to update own row.
-- We add profiles_admin_update_any so admins can update any profile. For non-admins updating
-- own row, we need to prevent role changes. A trigger handles that.
create or replace function public.prevent_non_admin_role_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- If role is being changed and updater is not admin, reject
  if old.role is distinct from new.role then
    if not exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ) then
      raise exception 'Only admins can change user roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_non_admin_role_update on public.profiles;
create trigger profiles_prevent_non_admin_role_update
  before update on public.profiles
  for each row
  execute function public.prevent_non_admin_role_update();
