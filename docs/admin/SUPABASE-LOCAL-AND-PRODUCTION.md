# Supabase: Local Development vs Production

Single source of truth so the app and CLI always target the right database.

---

## Rule

- **Local development** — App and scripts use the **local** Supabase instance. Migrations are applied to local with `supabase db reset` (not `supabase db push`).
- **Production** — Migrations are applied to the **linked remote** with `supabase db push` when you’re ready to deploy.

`supabase db push` only affects the **linked remote**. It does **not** update your local database. The local DB is updated only by `supabase start` (first run) or `supabase db reset`.

---

## Local development

### 1. Start local Supabase

```bash
supabase start
```

Use **Project URL** and keys from:

```bash
supabase status
```

### 2. Point the app at local

In `.env.local` set:

- `NEXT_PUBLIC_SUPABASE_URL` = **Project URL** from `supabase status` (e.g. `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key from `supabase status` (often labeled “Publishable” or see Studio → Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` = service role key (often labeled “Secret” or service_role in Studio)

So in local dev, **one** database: the one at `127.0.0.1:54321`. Both the Next.js app and any seed script (using `.env.local`) use it.

### 3. Apply migrations to local

After adding or changing migrations:

```bash
supabase db reset
```

This:

- Resets the local DB
- Reapplies all migrations in `supabase/migrations/` (including `fragrance_notes`)
- Runs `seed.sql` and `seed_formulas.sql` from `config.toml`

Then run any extra seeds (e.g. fragrance notes):

```bash
pnpm glossary:fetch-and-seed
```

### 4. Run the app

```bash
pnpm dev
```

The app and API routes use `.env.local` → local Supabase. No confusion with a remote.

---

## Pushing the database to production

When you want production to have the same schema (and optional data) as your migrations:

1. Link to the **production** project (if not already):

   ```bash
   supabase link --project-ref <your-production-project-ref>
   ```

2. Push migrations:

   ```bash
   supabase db push
   ```

3. Production env (e.g. Vercel) must use that project’s `NEXT_PUBLIC_SUPABASE_URL` and keys. No change to `.env.local` for local dev.

---

## Summary

| Target   | Apply migrations with   | App / scripts use env        |
|----------|--------------------------|------------------------------|
| **Local**   | `supabase db reset`       | `.env.local` → local URL/keys |
| **Production** | `supabase db push` (after link) | Vercel / prod env → prod URL/keys |

If the app says `relation "public.fragrance_notes" does not exist` in local dev, the local DB is missing that migration: run `supabase db reset`, then re-run any seeds (e.g. `pnpm glossary:fetch-and-seed`).
