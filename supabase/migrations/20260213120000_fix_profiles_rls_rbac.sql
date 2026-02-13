-- MOOD MNKY Lab – Fix profiles RLS for RBAC
-- Purpose: Normalize uid() to auth.uid(), add TO authenticated, add admin select policy
-- Aligns with Supabase RLS best practices

-- ========== 1. Fix profiles_select_own (TO authenticated, use auth.uid) ==========
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- ========== 2. Fix profiles_select_owner (use auth.uid explicitly) ==========
drop policy if exists "profiles_select_owner" on public.profiles;
create policy "profiles_select_owner"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- ========== 3. Fix profiles_admin_update_any (use auth.uid explicitly) ==========
drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  )
  with check (true);

-- ========== 4. Add admin SELECT policy (admins can read all profiles) ==========
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );
