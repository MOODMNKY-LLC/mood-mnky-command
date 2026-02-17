-- MOOD MNKY Lab – Profiles grants and user management
-- Purpose: Fix permission denied, consolidate RLS to auth.uid(), enrich handle_new_user,
--          ensure user-avatars storage policies
-- Aligns with Supabase User Management Starter pattern

-- ========== 1. Restore table grants (fix permission denied) ==========
-- anon and authenticated need table-level access for RLS to apply
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ========== 2. Drop redundant/legacy RLS policies ==========
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can update their current_bucket." on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "profiles_insert_owner" on public.profiles;
drop policy if exists "profiles_select_owner" on public.profiles;
drop policy if exists "profiles_update_owner" on public.profiles;

-- ========== 3. Recreate consolidated profiles policies (use auth.uid) ==========
-- Drop existing to ensure auth.uid() and TO clauses
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Public profiles viewable by everyone (anon + authenticated)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  to anon, authenticated
  using (true);

-- profiles_select_public (profiles with handle are publicly discoverable)
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (handle IS NOT NULL);

-- profiles_admin_select_all and profiles_admin_update_any (keep - use is_admin())
-- Already correct from fix_profiles_rls_recursion
-- Users cannot delete profiles - keep
-- Service role can do all - keep

-- ========== 4. Enrich handle_new_user with full_name and avatar_url ==========
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

  insert into public.profiles (id, display_name, full_name, avatar_url, role, email, last_sign_in_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new_role,
    new.email,
    new.last_sign_in_at
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ========== 5. Restore user-avatars storage policies ==========
-- remote_schema dropped these; app uses user-avatars bucket
drop policy if exists "public_read_user_avatars" on storage.objects;
create policy "public_read_user_avatars"
  on storage.objects for select
  using (bucket_id = 'user-avatars');

drop policy if exists "auth_upload_user_avatars" on storage.objects;
create policy "auth_upload_user_avatars"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "auth_update_user_avatars" on storage.objects;
create policy "auth_update_user_avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (bucket_id = 'user-avatars');

drop policy if exists "auth_delete_own_user_avatars" on storage.objects;
create policy "auth_delete_own_user_avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'user-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
