-- Cast encid to text in hydaelyn views so the app (expecting encid: string) receives consistent types.
-- public.encounter_table.encid may be integer (ACT ODBC); app types expect string.

drop view if exists hydaelyn.encounter_table;
create or replace view hydaelyn.encounter_table as
select
  encid::text as encid,
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

comment on view hydaelyn.encounter_table is 'View over public.encounter_table (ACT ODBC export); encid as text for app.';

drop view if exists hydaelyn.combatant_table;
create or replace view hydaelyn.combatant_table as
select
  row_number() over (order by encid, name, starttime)::int as id,
  encid::text as encid,
  name,
  job,
  dps,
  encdps,
  damage,
  now() as created_at
from public.combatant_table;

comment on view hydaelyn.combatant_table is 'View over public.combatant_table (ACT ODBC export); encid as text for app.';

drop view if exists hydaelyn.current_table;
create or replace view hydaelyn.current_table as
select
  row_number() over (order by encid)::int as id,
  encid::text as encid,
  'Current'::varchar(64) as title,
  min(starttime)::timestamptz as starttime,
  max(duration) as duration,
  (case when max(duration) > 0 then sum(damage)::double precision / max(duration) else null end) as encdps,
  now() as updated_at
from public.current_table
group by encid;

comment on view hydaelyn.current_table is 'View over public.current_table (one row per encounter); encid as text for app.';

grant select on hydaelyn.encounter_table to authenticated;
grant select on hydaelyn.combatant_table to authenticated;
grant select on hydaelyn.current_table to authenticated;
