-- Migration: XP helper functions (compute_level_from_xp, award_xp)
-- Purpose: Level curve and atomic award (ledger + state update). award_xp is SECURITY DEFINER
-- so server-side code can call it without bypassing RLS on direct table writes.

-- ========== 1. Level curve: XP total -> level (simple staircase) ==========
-- Levels 1-5 at 0, 100, 250, 500, 900; then +500 per level. Tune later.
create or replace function public.compute_level_from_xp(xp_total bigint)
returns int
language plpgsql
security invoker
set search_path = ''
stable
as $$
declare
  x bigint := greatest(0, xp_total);
begin
  if x < 100 then return 1; end if;
  if x < 250 then return 2; end if;
  if x < 500 then return 3; end if;
  if x < 900 then return 4; end if;
  return 5 + floor((x - 900)::numeric / 500)::int;
end;
$$;

comment on function public.compute_level_from_xp(bigint) is 'Maps XP total to level; simple staircase (1-5 then +500/level).';

-- ========== 2. Award XP: append to ledger and upsert state ==========
create or replace function public.award_xp(
  p_profile_id uuid,
  p_source text,
  p_source_ref text,
  p_xp_delta int,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_total bigint;
  new_level int;
begin
  insert into public.xp_ledger (profile_id, source, source_ref, xp_delta, reason)
  values (p_profile_id, p_source, p_source_ref, p_xp_delta, p_reason);

  select coalesce(sum(xp_delta), 0) into new_total
  from public.xp_ledger
  where profile_id = p_profile_id;

  select public.compute_level_from_xp(new_total) into new_level;

  insert into public.xp_state (profile_id, xp_total, level, updated_at)
  values (p_profile_id, new_total::int, new_level, now())
  on conflict (profile_id) do update
  set xp_total = new_total::int, level = new_level, updated_at = now();
end;
$$;

comment on function public.award_xp(uuid, text, text, int, text) is 'Appends XP to ledger and updates xp_state; call from server only.';
