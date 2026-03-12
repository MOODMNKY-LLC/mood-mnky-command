# Migration duplicate version fix (2026-02-18)

## Problem

Two local migrations shared the same version `20260218000000`:

- `20260218000000_storefront_assistant_chat.sql`
- `20260218000000_mnky_verse_tracks_bucket.sql`

Supabase records migrations by version in `supabase_migrations.schema_migrations`. Only one row per version is allowed, so `supabase db push` failed with:

```text
ERROR: duplicate key value violates unique constraint "schema_migrations_pkey"
Key (version)=(20260218000000) already exists.
```

Remote already had one of these applied (as `20260218000000`); the other could not be applied because of the duplicate version.

## Solution

1. **Resolved duplicate version**
   - Removed the two files with version `20260218000000`.
   - Added:
     - `20260218010000_storefront_assistant_chat.sql` (storefront chat tables; idempotent).
     - `20260218050000_mnky_verse_tracks_bucket.sql` (MNKY Verse Tracks bucket; unchanged, already idempotent).

2. **Idempotent storefront migration**
   - `20260218010000_storefront_assistant_chat.sql` uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` so it is safe to run whether or not the objects already exist (e.g. if the original `20260218000000` on remote was the storefront migration).

3. **No change to remote history**
   - The existing row `20260218000000` on remote was left as-is. New migrations `20260218010000`, `20260218050000`, plus any later pending ones (`20260218120000`, `20260220000000`) are applied by a normal push.

## What you need to do

From the project root, with the Supabase project linked and working auth/network:

```bash
npx supabase migration list
npx supabase db push --include-all --yes
```

- `migration list`: confirms local vs remote (you should see `20260218010000`, `20260218050000`, `20260218120000`, `20260220000000` as local; remote may show only some of these until push completes).
- `db push --include-all --yes`: applies all pending migrations to the linked remote database.

If you hit connection or SASL auth errors, check network, VPN, and Supabase login (`supabase login`) and retry.
