# Pull production Supabase schema to local

The project was created in v0 against production, so migration history didn’t match local. Use these steps to sync.

## 1. Link to production (if not already)

```bash
supabase link --project-ref coevjitstmuhdhbyizpk
```

Use your database password when prompted (Supabase Dashboard → Project Settings → Database).

## 2. Repair migration history (one-time)

Run these so the remote history matches what we have locally, then pull can run:

```bash
supabase migration repair --status reverted 20260205221621
supabase migration repair --status reverted 20260205221918
supabase migration repair --status reverted 20260205222137
supabase migration repair --status applied 20250206000000
```

**Note:** This only updates the migration history table on production; it does not change tables or data.

## 3. Pull schema from production

**Important:** Use password-based auth so the CLI doesn’t hit the pooler’s SCRAM cache. Set your **database password** (Dashboard → Project Settings → Database) and run:

```bash
# Windows (PowerShell)
$env:SUPABASE_DB_PASSWORD = "your-database-password"
supabase db pull

# Or one-liner (replace with your actual password)
SUPABASE_DB_PASSWORD=your-database-password supabase db pull
```

On Windows CMD use `set SUPABASE_DB_PASSWORD=your-password` before the command.

This creates a new migration file under `supabase/migrations/` with the diff between your current migrations and production.

### If you still see "SASL: server signature is missing"

1. **Dashboard:** Project Settings → Database → check for blocked IPs and unblock yours if needed.
2. **Relink and skip pooler (beta CLI):**
   ```bash
   npx supabase@beta link --project-ref coevjitstmuhdhbyizpk --skip-pooler
   npx supabase@beta db pull
   ```
3. See [Supabase: failed SASL auth](https://supabase.com/docs/guides/troubleshooting/supabase-cli-failed-sasl-auth-or-invalid-scram-server-final-message).

## 4. Apply locally (optional)

If you use local Supabase:

```bash
supabase db reset
```

Or start fresh and run migrations:

```bash
supabase start
```

---

If the first repair already ran successfully, you may only need to run the remaining three repair commands, then `supabase db pull`.
