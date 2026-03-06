-- Hydaelyn ACT ODBC: replace empty hydaelyn tables with views over public.
-- When ACT ODBC exports to the default (public) schema, the app still reads from
-- hydaelyn.* and sees the same data via these views.

-- 1. Remove from Realtime publication if present (views cannot be in publication).
do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'hydaelyn' and tablename = 'encounter_table') then
    alter publication supabase_realtime drop table hydaelyn.encounter_table;
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'hydaelyn' and tablename = 'combatant_table') then
    alter publication supabase_realtime drop table hydaelyn.combatant_table;
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'hydaelyn' and tablename = 'current_table') then
    alter publication supabase_realtime drop table hydaelyn.current_table;
  end if;
end $$;

-- 2. Drop policies only when relation is still a table (avoid error if already a view).
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'hydaelyn' and tablename = 'combatant_table') then
    drop policy if exists "hydaelyn_combatant_select" on hydaelyn.combatant_table;
  end if;
  if exists (select 1 from pg_tables where schemaname = 'hydaelyn' and tablename = 'encounter_table') then
    drop policy if exists "hydaelyn_encounter_select" on hydaelyn.encounter_table;
  end if;
  if exists (select 1 from pg_tables where schemaname = 'hydaelyn' and tablename = 'current_table') then
    drop policy if exists "hydaelyn_current_select" on hydaelyn.current_table;
  end if;
  if exists (select 1 from pg_tables where schemaname = 'hydaelyn' and tablename = 'damagetype_table') then
    drop policy if exists "hydaelyn_damagetype_select" on hydaelyn.damagetype_table;
  end if;
end $$;

-- Drop existing view or table so we can recreate as view (idempotent: check type per relation).
do $$
declare
  r record;
begin
  for r in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'hydaelyn'
      and c.relname in ('combatant_table', 'encounter_table', 'current_table', 'damagetype_table')
  loop
    if r.relkind = 'v' then
      execute format('drop view if exists hydaelyn.%I', r.relname);
    elsif r.relkind = 'r' then
      execute format('drop table if exists hydaelyn.%I', r.relname);
    end if;
  end loop;
end $$;

-- 2b. Ensure public tables exist (ACT ODBC creates these when exporting; stub them if missing so views work).
create table if not exists public.encounter_table (
  encid integer,
  title varchar(256),
  starttime timestamp,
  endtime timestamp,
  duration bigint,
  damage bigint,
  encdps double precision,
  zone varchar(256),
  kills integer,
  deaths integer
);

create table if not exists public.combatant_table (
  encid integer,
  name varchar(256),
  job varchar(64),
  dps double precision,
  encdps double precision,
  damage bigint,
  starttime timestamp
);

create table if not exists public.current_table (
  encid integer,
  starttime timestamp,
  duration bigint,
  damage bigint
);

create table if not exists public.damagetype_table (
  "type" varchar(64)
);

-- 3. Create views over public (same names so app code unchanged).

-- encounter_table: public columns match; add created_at for compatibility.
create or replace view hydaelyn.encounter_table as
select
  encid,
  title,
  starttime::timestamptz as starttime,
  endtime::timestamptz as endtime,
  duration,
  damage,
  encdps,
  zone,
  kills,
  deaths,
  now() as created_at
from public.encounter_table;

comment on view hydaelyn.encounter_table is 'View over public.encounter_table (ACT ODBC export).';

-- combatant_table: public has no id; generate stable id. Map columns app expects.
create or replace view hydaelyn.combatant_table as
select
  row_number() over (order by encid, name, starttime)::int as id,
  encid,
  name,
  job,
  dps,
  encdps,
  damage,
  now() as created_at
from public.combatant_table;

comment on view hydaelyn.combatant_table is 'View over public.combatant_table (ACT ODBC export).';

-- current_table: public.current_table is per-combatant; aggregate to one row per encid for app.
create or replace view hydaelyn.current_table as
select
  row_number() over (order by encid)::int as id,
  encid,
  'Current'::varchar(64) as title,
  min(starttime)::timestamptz as starttime,
  max(duration) as duration,
  (case when max(duration) > 0 then sum(damage)::double precision / max(duration) else null end) as encdps,
  now() as updated_at
from public.current_table
group by encid;

comment on view hydaelyn.current_table is 'View over public.current_table (one row per encounter).';

-- damagetype_table: public has encid/combatant/type etc.; expose id, name for app compatibility.
create or replace view hydaelyn.damagetype_table as
select
  row_number() over (order by t.type_name)::int as id,
  t.type_name::varchar(64) as name,
  now() as created_at
from (select distinct "type" as type_name from public.damagetype_table) t;

comment on view hydaelyn.damagetype_table is 'View over public.damagetype_table (ACT ODBC export).';

-- 4. Grant SELECT to authenticated so the app can read.
grant select on hydaelyn.encounter_table to authenticated;
grant select on hydaelyn.combatant_table to authenticated;
grant select on hydaelyn.current_table to authenticated;
grant select on hydaelyn.damagetype_table to authenticated;
