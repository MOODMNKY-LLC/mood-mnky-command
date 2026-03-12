# Supabase `db pull` — "failed to create migration table: unexpected EOF"

## What happened

When you ran `supabase db pull` and answered **Y** to "Update remote migration history table?", the CLI failed with:

```text
failed to create migration table: unexpected EOF
```

The CLI was trying to **insert a row** into the remote `supabase_migrations.schema_migrations` table (for the new migration `20260219031853_remote_schema.sql`). The connection was closed before the response was fully read → "unexpected EOF".

## Cause

Supabase CLI uses the **connection pooler** (Supavisor) by default when linked. The pooler can close connections during or right after writes, which leads to "unexpected EOF" or timeouts on migration history updates. This is a known class of issue (see [supabase/cli#4687](https://github.com/supabase/cli/issues/4687)).

## Fixes (pick one)

### Option A: Repair migration history with direct connection (recommended)

Use the **database password** so the CLI can use a direct connection and avoid the pooler for the repair:

```powershell
# PowerShell: set password then repair
$env:SUPABASE_DB_PASSWORD = "your-database-password"
supabase migration repair --status applied 20260219031853
```

That inserts the missing row for `20260219031853` on the remote migration history table. After that, `supabase db pull` should no longer report a history mismatch.

### Option B: Skip pooler (beta CLI)

If you use the beta CLI and want to avoid the pooler for pull/repair:

```bash
npx supabase@beta link --project-ref coevjitstmuhdhbyizpk --skip-pooler
npx supabase@beta migration repair --status applied 20260219031853
```

### Option C: Do nothing (if you don't need history in sync)

If you don't care about recording `20260219031853` on the remote:

- You already have the diff file `supabase/migrations/20260219031853_remote_schema.sql`.
- Next time you run `db pull`, answer **n** to "Update remote migration history table?" to avoid the EOF.
- Your remote DB and app keep working; only the migration history table stays out of sync with that one file.

## Verify fragrance_notes columns (for LABZ sync)

Your **remote** migration history already includes `20260220100000_fragrance_notes_shopify_metaobject.sql`. So the columns `shopify_metaobject_id` and `shopify_synced_at` may already exist on production.

1. In **Supabase Dashboard** → **Table Editor** → **fragrance_notes**, check for columns **shopify_metaobject_id** and **shopify_synced_at**.
2. If they are missing, run this in **SQL Editor** (once):

```sql
alter table public.fragrance_notes
  add column if not exists shopify_metaobject_id text,
  add column if not exists shopify_synced_at timestamptz;
```

Then run **Sync fragrance notes to Shopify** from LABZ Pages.
