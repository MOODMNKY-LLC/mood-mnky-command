-- Grant usage on hydaelyn schema so Supabase PostgREST (anon, authenticated) can query it.
grant usage on schema hydaelyn to anon, authenticated;
grant select on all tables in schema hydaelyn to anon, authenticated;
alter default privileges in schema hydaelyn grant select on tables to anon, authenticated;
