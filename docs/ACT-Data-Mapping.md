# ACT Data Mapping: ODBC, OverlayPlugin, and Hydaelyn

This document maps ACT/OverlayPlugin data shapes to the Hydaelyn schema so ingest logic and view definitions stay consistent.

## Data sources

| Source | How data arrives | Where it lands |
|--------|-------------------|----------------|
| **ACT ODBC** | ACT exports to Postgres after combat (ODBC SQL). Tables created in `public` by ACT. | `public.encounter_table`, `public.combatant_table`, `public.current_table`, `public.damagetype_table` |
| **Overlay ingest** | OverlayPlugin overlay POSTs to `POST /api/ingest/combat` with `encounter` and `combatants` (and `outcome` when encounter ends). | Same tables (when `outcome` is set), plus `overlay_config.last_combat_data` and `pulls` |

The app reads via **hydaelyn** schema views (over `public`), so both ODBC and overlay-sourced rows appear in the ACT dashboard.

## ACT ODBC table columns (reference)

ACT creates tables in the default schema (here, `public`). Typical column names (see [ACT forum: Exporting to Postgres with ODBC](https://forums.advancedcombattracker.com/discussion/29/exporting-to-postgres-with-odbc)):

- **encounter_table:** `encid` (integer), `title`, `starttime`, `endtime`, `duration`, `damage`, `encdps`, `zone`, `kills`, `deaths`
- **combatant_table:** `encid`, `name`, `job`, `dps`, `encdps`, `damage`, `starttime` (and possibly more)
- **current_table:** per-combatant current snapshot; columns vary (e.g. `encid`, `starttime`, `duration`, `damage`)

Our stub in `20260506120000_hydaelyn_act_odbc_views_over_public.sql` defines these so views work before ACT has exported.

## OverlayPlugin CombatData shape

The ingest body (and OverlayPlugin CombatData) uses PascalCase in many places:

- **encounter:** `title`, `duration`, `ENCDPS` or `EncDPS`, `damage` or `Damage`, `zone` or `Zone`, `kills`, `deaths`, etc.
- **combatants:** `{ [name]: { Job or job, damage or Damage, ENCDPS or EncDPS, EncDPS, ... } }`

The ingest route normalizes these when writing to `public.encounter_table` and `public.combatant_table` (e.g. `encounter.title` / `encounter.Title`, `combatants[name].Job` / `job`, `ENCDPS` / `EncDPS`).

## hydaelyn views (app-facing)

The app queries `hydaelyn.encounter_table`, `hydaelyn.combatant_table`, `hydaelyn.current_table`. These are views over `public.*` that:

- Cast `encid` to `text` so the app receives a string (see migration `20260506120001_hydaelyn_act_views_encid_text.sql`).
- Add `created_at` / `updated_at` where needed.
- For `combatant_table`, generate a stable `id` via `row_number()` (public has no `id`).
- For `current_table`, aggregate public’s per-combatant rows to one row per `encid`.

## Overlay-sourced encid

Overlay ingest uses a sequence `public.overlay_encid_seq` (start 1000000000) so overlay encounter IDs do not collide with ACT’s typically small integer encids. The app calls `get_next_overlay_encid()` and inserts one row into `public.encounter_table` and N rows into `public.combatant_table` per completed encounter (when `outcome` is present).

## GraphQL

The ACT dashboard loads data via REST (`supabase.schema("hydaelyn")` with three parallel calls). Supabase exposes a GraphQL endpoint at `{SUPABASE_URL}/graphql/v1`; for a single-query load you would expose the hydaelyn views (or wrappers in `graphql_public`) to pg_graphql and query encounters, combatants, and current in one request. Until then, REST remains the supported path.

## Future: ACT plugin for push

The [ACT plugin API](https://advancedcombattracker.com/apidoc/html/N_Advanced_Combat_Tracker.htm) (e.g. `FormActMain.AddCombatAction(MasterSwing)`, encounter lifecycle) is for C# plugins running inside ACT. The web app does not call it directly. For “push on every combat action,” a small C# ACT plugin would subscribe to ACT events and HTTP POST to Hydaelyn’s ingest API; that would be a separate project (e.g. in `temp/` or its own repo). ODBC and OverlayPlugin remain the main integration paths.
