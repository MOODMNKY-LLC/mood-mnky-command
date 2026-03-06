-- Fix infinite recursion in RLS between statics and static_members.
-- Policies cross-referenced each other (statics SELECT -> static_members; static_members SELECT -> statics).
-- Use a SECURITY DEFINER function so policies do not query the other table under RLS.

create or replace function public.static_ids_for_user(uid uuid)
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.statics where owner_id = uid
  union
  select static_id from public.static_members where profile_id = uid;
$$;

comment on function public.static_ids_for_user(uuid) is 'Static IDs the user may access (owner or member). Used by RLS to avoid recursion.';

-- Replace statics policies to use the helper (no subquery on static_members).
drop policy if exists "statics_select_owner_or_member" on public.statics;
create policy "statics_select_owner_or_member"
  on public.statics for select to authenticated
  using (id in (select public.static_ids_for_user(auth.uid())));

drop policy if exists "static_members_select_member_or_owner" on public.static_members;
create policy "static_members_select_member_or_owner"
  on public.static_members for select to authenticated
  using (static_id in (select public.static_ids_for_user(auth.uid())));

-- static_members insert/update/delete: owner only. Reading statics by owner_id does not trigger recursion (statics policy uses function).
drop policy if exists "static_members_insert_owner" on public.static_members;
create policy "static_members_insert_owner"
  on public.static_members for insert to authenticated
  with check (static_id in (select id from public.statics where owner_id = auth.uid()));

drop policy if exists "static_members_update_owner" on public.static_members;
create policy "static_members_update_owner"
  on public.static_members for update to authenticated
  using (static_id in (select id from public.statics where owner_id = auth.uid()));

drop policy if exists "static_members_delete_owner" on public.static_members;
create policy "static_members_delete_owner"
  on public.static_members for delete to authenticated
  using (static_id in (select id from public.statics where owner_id = auth.uid()));

-- static_reports and aggregated_metrics: use same helper to avoid any recursion via statics/static_members.
drop policy if exists "static_reports_select_member" on public.static_reports;
create policy "static_reports_select_member"
  on public.static_reports for select to authenticated
  using (static_id in (select public.static_ids_for_user(auth.uid())));

drop policy if exists "static_reports_insert_member" on public.static_reports;
create policy "static_reports_insert_member"
  on public.static_reports for insert to authenticated
  with check (static_id in (select public.static_ids_for_user(auth.uid())));

-- delete: only static owners (not just any member)
drop policy if exists "static_reports_delete_owner" on public.static_reports;
create policy "static_reports_delete_owner"
  on public.static_reports for delete to authenticated
  using (static_id in (select id from public.statics where owner_id = auth.uid()));

drop policy if exists "aggregated_metrics_select_member" on public.aggregated_metrics;
create policy "aggregated_metrics_select_member"
  on public.aggregated_metrics for select to authenticated
  using (static_id in (select public.static_ids_for_user(auth.uid())));
