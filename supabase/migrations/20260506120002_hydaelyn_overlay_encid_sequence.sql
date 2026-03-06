-- Sequence for overlay-sourced encounter IDs so they don't collide with ACT ODBC encid (typically small integers).
-- Ingest uses get_next_overlay_encid() when writing to public.encounter_table / combatant_table.

create sequence if not exists public.overlay_encid_seq start 1000000000;

create or replace function public.get_next_overlay_encid()
returns integer
language sql
security definer
set search_path = public
as $$
  select nextval('public.overlay_encid_seq')::integer;
$$;

comment on function public.get_next_overlay_encid() is 'Returns next encounter id for overlay ingest; used when writing to public.encounter_table.';

grant execute on function public.get_next_overlay_encid() to service_role;
grant execute on function public.get_next_overlay_encid() to authenticated;
