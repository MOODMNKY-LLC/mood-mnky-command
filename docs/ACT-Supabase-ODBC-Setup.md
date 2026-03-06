# ACT → Local Supabase ODBC Setup

## Driver installed

The **PostgreSQL ODBC driver (psqlODBC)** 64-bit is installed. Registered driver names:

- `PostgreSQL Unicode(x64)` (recommended for 64-bit ACT)
- `PostgreSQL Unicode`
- `PostgreSQL ANSI(x64)`
- `PostgreSQL ANSI`

## Connection string for local Supabase

In **ACT → Options → Output Display → ODBC (SQL)** use:

```
DRIVER={PostgreSQL Unicode(x64)};SERVER=127.0.0.1;PORT=54500;DATABASE=postgres;UID=postgres;PWD=postgres;
```

If that fails, try:

```
DRIVER={PostgreSQL Unicode};SERVER=127.0.0.1;PORT=54500;DATABASE=postgres;UID=postgres;PWD=postgres;
```

Values come from `supabase status` (DB port **54500**; API port 54521 is not used for ODBC).

## PostgreSQL type fix (required for Validate Table Setup)

ACT generates `DOUBLE`; PostgreSQL expects `DOUBLE PRECISION`. In the same ODBC (SQL) panel:

1. **DataSource Compatibility Hacks** — add a **Connection String Match** entry that matches this connection (e.g. Find: `127.0.0.1`, Replace: `127.0.0.1`).
2. Add **SQL Find / Replace**: Find `DOUBLE`, Replace `DOUBLE PRECISION`.
3. Run **Validate Table Setup** again.

See [ACT forum: Exporting to Postgres with ODBC](https://forums.advancedcombattracker.com/discussion/29/exporting-to-postgres-with-odbc).

## Additional compatibility hacks (intermittent errors)

After the four core tables are created, ACT may still emit SQL that PostgreSQL rejects. Add these **SQL Find / Replace** entries in **DataSource Compatibility Hacks** (same Connection String Match as above).

### 1. ERROR [42704] type "tinyint" does not exist

ACT uses `TINYINT` (MySQL/SQL Server); PostgreSQL uses `SMALLINT`.

- **Find:** `TINYINT`  
- **Replace:** `SMALLINT`

### 2. ERROR [22008] date/time field value out of range: "0000-00-00 00:00:00"

PostgreSQL does not allow the sentinel date `0000-00-00 00:00:00` (e.g. for empty start/end time). Replace it with a valid timestamp.

- **Find:** `0000-00-00 00:00:00`  
- **Replace:** `1970-01-01 00:00:00`

If ACT sends the value with quotes in the SQL, use the same pattern including quotes (e.g. Find: `'0000-00-00 00:00:00'`, Replace: `'1970-01-01 00:00:00'`). Add whichever form matches the failing query.

### Summary of hacks (all under one Connection String Match)

| Find | Replace |
| ---- | ------- |
| `DOUBLE` | `DOUBLE PRECISION` |
| `TINYINT` | `SMALLINT` |
| `0000-00-00 00:00:00` | `1970-01-01 00:00:00` |

Then run **Validate Table Setup** again. If new errors appear (e.g. other types or date formats), add further Find/Replace rules the same way.

## Quick test

1. Ensure local Supabase is running: `supabase status`.
2. In ACT: **Test Connection** with the string above.
3. Add the DOUBLE → DOUBLE PRECISION hack, then **Validate Table Setup**.
4. Enable **Export data to an ODBC DB after combat** and run a test encounter.

## Debugging with local Supabase

To inspect ACT-created tables and confirm types (e.g. after compatibility hacks), use the local DB URL from `supabase status`:

```bash
# List ACT tables
psql "postgresql://postgres:postgres@127.0.0.1:54500/postgres" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('encounter_table','combatant_table','current_table','damagetype_table');"

# Describe a table
psql "postgresql://postgres:postgres@127.0.0.1:54500/postgres" -c "\d+ encounter_table"
```

Expected ACT tables: `encounter_table`, `combatant_table`, `current_table`, `damagetype_table`. If you use “Export down to AttackType tables” or deeper, more tables may be created; any that use `TINYINT` need the TINYINT → SMALLINT hack.

## Driver source

- Official psqlODBC: https://odbc.postgresql.org/
- Windows 64-bit MSI: https://www.postgresql.org/ftp/odbc/releases/ (e.g. REL-17_00_0007 → `psqlodbc_x64.msi`).
