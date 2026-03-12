-- Add hydaelyn tables to Realtime publication so clients can subscribe to postgres_changes.
-- Optional: for higher scale, prefer broadcast + database triggers (see use-realtime.mdc).
alter publication supabase_realtime add table hydaelyn.encounter_table;
alter publication supabase_realtime add table hydaelyn.combatant_table;
alter publication supabase_realtime add table hydaelyn.current_table;
