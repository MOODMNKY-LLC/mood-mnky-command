-- Hydaelyn ACT ODBC mirror: optional schema and tables that mirror ACT's ODBC export.
-- Users can point ACT ODBC to Supabase and export into these tables, or a future
-- companion can fill them. App can query hydaelyn.encounter_table etc. and show
-- "No ACT data yet" when empty.

create schema if not exists hydaelyn;

comment on schema hydaelyn is 'Hydaelyn app schema; ACT ODBC mirror tables for encounter/combatant data.';

-- encounter_table: mirrors ACT ODBC encounter export.
-- See https://forums.advancedcombattracker.com/discussion/29/exporting-to-postgres-with-odbc
create table if not exists hydaelyn.encounter_table (
  encid char(8) primary key,
  title varchar(64),
  starttime timestamptz,
  endtime timestamptz,
  duration int,
  damage bigint,
  encdps double precision,
  zone varchar(64),
  kills int,
  deaths int,
  created_at timestamptz default now()
);

comment on table hydaelyn.encounter_table is 'Mirrors ACT ODBC encounter_table; create if user has not exported from ACT yet.';

-- combatant_table: mirrors ACT ODBC combatant export (typical columns).
create table if not exists hydaelyn.combatant_table (
  id serial primary key,
  encid char(8) references hydaelyn.encounter_table(encid) on delete cascade,
  name varchar(128),
  job varchar(32),
  dps double precision,
  encdps double precision,
  damage bigint,
  created_at timestamptz default now()
);

comment on table hydaelyn.combatant_table is 'Mirrors ACT ODBC combatant_table for per-encounter combatant stats.';

create index if not exists hydaelyn_combatant_encid on hydaelyn.combatant_table(encid);

-- current_table: optional ACT ODBC current encounter snapshot.
create table if not exists hydaelyn.current_table (
  id serial primary key,
  encid char(8),
  title varchar(64),
  starttime timestamptz,
  duration int,
  encdps double precision,
  updated_at timestamptz default now()
);

comment on table hydaelyn.current_table is 'Optional mirror of ACT ODBC current_table (current encounter snapshot).';

-- damagetype_table: optional ACT ODBC damage type lookup.
create table if not exists hydaelyn.damagetype_table (
  id serial primary key,
  name varchar(64),
  created_at timestamptz default now()
);

comment on table hydaelyn.damagetype_table is 'Optional mirror of ACT ODBC damagetype_table.';

-- RLS: allow authenticated read on hydaelyn tables (app shows "ACT data" when present).
alter table hydaelyn.encounter_table enable row level security;
alter table hydaelyn.combatant_table enable row level security;
alter table hydaelyn.current_table enable row level security;
alter table hydaelyn.damagetype_table enable row level security;

drop policy if exists "hydaelyn_encounter_select" on hydaelyn.encounter_table;
create policy "hydaelyn_encounter_select"
  on hydaelyn.encounter_table for select to authenticated using (true);

drop policy if exists "hydaelyn_combatant_select" on hydaelyn.combatant_table;
create policy "hydaelyn_combatant_select"
  on hydaelyn.combatant_table for select to authenticated using (true);

drop policy if exists "hydaelyn_current_select" on hydaelyn.current_table;
create policy "hydaelyn_current_select"
  on hydaelyn.current_table for select to authenticated using (true);

drop policy if exists "hydaelyn_damagetype_select" on hydaelyn.damagetype_table;
create policy "hydaelyn_damagetype_select"
  on hydaelyn.damagetype_table for select to authenticated using (true);
