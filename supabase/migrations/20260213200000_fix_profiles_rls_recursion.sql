-- MOOD MNKY Lab – Fix infinite recursion in profiles RLS
-- Problem: Policies on profiles (profiles_admin_select_all, profiles_admin_update_any) and
-- funnel_definitions (funnel_definitions_insert_admin, etc.) use subqueries that SELECT from
-- profiles to check if current user is admin. That SELECT triggers profiles RLS, which
-- again queries profiles → infinite recursion.
--
-- Solution: Use a SECURITY DEFINER function that runs with definer privileges, bypassing
-- RLS when reading profiles. All policies then call this function instead of inline subqueries.

-- ========== 1. Create is_admin() function ==========
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ========== 2. Fix profiles policies (avoid self-reference) ==========
drop policy if exists "profiles_admin_update_any" on public.profiles;
create policy "profiles_admin_update_any"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (true);

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- ========== 3. Fix funnel_definitions policies ==========
drop policy if exists "funnel_definitions_select_authenticated" on public.funnel_definitions;
create policy "funnel_definitions_select_authenticated"
  on public.funnel_definitions for select
  to authenticated
  using (
    status = 'active'
    or public.is_admin()
  );

drop policy if exists "funnel_definitions_insert_admin" on public.funnel_definitions;
create policy "funnel_definitions_insert_admin"
  on public.funnel_definitions for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "funnel_definitions_update_admin" on public.funnel_definitions;
create policy "funnel_definitions_update_admin"
  on public.funnel_definitions for update
  to authenticated
  using (public.is_admin());

drop policy if exists "funnel_definitions_delete_admin" on public.funnel_definitions;
create policy "funnel_definitions_delete_admin"
  on public.funnel_definitions for delete
  to authenticated
  using (public.is_admin());
