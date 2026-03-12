-- MOOD MNKY Lab – Sync profiles with auth.users for email and last_sign_in_at
-- Purpose: Populate profiles.email and profiles.last_sign_in_at from auth.users
-- so the Members UI shows correct data.

-- ========== 1. Update handle_new_user to set email and last_sign_in_at on insert ==========
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
begin
  select case when (select count(*) from public.profiles) = 0 then 'admin' else 'pending' end
  into new_role;

  insert into public.profiles (id, display_name, role, email, last_sign_in_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new_role,
    new.email,
    new.last_sign_in_at
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ========== 2. Backfill existing profiles from auth.users ==========
update public.profiles p
set
  email = coalesce(p.email, u.email),
  last_sign_in_at = coalesce(u.last_sign_in_at, p.last_sign_in_at)
from auth.users u
where u.id = p.id;

-- ========== 3. Trigger to sync last_sign_in_at on auth.users update ==========
-- Drop first to avoid "must be owner of function" when replacing a function created by another role.
-- CASCADE drops the trigger that depends on this function.
drop function if exists public.sync_profile_from_auth_user() cascade;

create function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = coalesce(profiles.email, new.email),
    last_sign_in_at = new.last_sign_in_at
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_sync_profile on auth.users;
create trigger on_auth_user_updated_sync_profile
  after update of last_sign_in_at, email on auth.users
  for each row
  execute function public.sync_profile_from_auth_user();
