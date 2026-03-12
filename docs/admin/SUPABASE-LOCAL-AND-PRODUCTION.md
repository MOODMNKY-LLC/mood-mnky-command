# Supabase: Local Development vs Production

Single source of truth so the app and CLI always target the right database.

---

## Two projects in this repo

| Project | Start from | Studio URL | Use |
|--------|------------|------------|-----|
| **Main (monorepo)** | Repo root: `supabase start` or `pnpm supabase:start` | http://127.0.0.1:54523 | apps/web, Hydaelyn, Dojo, LABZ — single-tenant DB |
| **Multi-tenant (MT)** | Repo root: `supabase start --workdir supabase-mt` or `pnpm supabase-mt:start` | http://127.0.0.1:54525 | Tenants, tenant_members, brand copy, etc. |

The **main** project is in `supabase/`; the **MT** project is in `supabase-mt/supabase/` (CLI expects a `supabase` subfolder). If you only run `supabase start` from the repo root, you get the main DB only. To see the MT schema locally, run **from repo root**: `pnpm supabase-mt:start` or `supabase start --workdir supabase-mt` — do not `cd` into `supabase-mt`; the `--workdir` flag tells the CLI which project to use.

---

## Rule

- **Local development** — App and scripts use the **local** Supabase instance. Migrations are applied to local with `supabase db reset` (not `supabase db push`).
- **Production** — Migrations are applied to the **linked remote** with `supabase db push` when you’re ready to deploy.

`supabase db push` only affects the **linked remote**. It does **not** update your local database. The local DB is updated only by `supabase start` (first run) or `supabase db reset`.

---

## New local project (e.g. after `supabase stop`)

If you just ran `supabase stop` or are setting up from scratch:

1. **Start local Supabase** (from repo root):

   ```bash
   supabase start
   ```
   Or: `pnpm supabase:start`

2. **Copy local credentials** into `.env.local`:

   ```bash
   supabase status
   ```

   From the output, set in `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL` = **API URL** (e.g. `http://127.0.0.1:54521` — port from `supabase/config.toml` [api] port)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = **anon key** (labeled "anon key" or "anon public" in output)
   - `SUPABASE_SERVICE_ROLE_KEY` = **service_role key**

3. **Apply migrations and seed** (first time or after adding migrations):

   ```bash
   supabase db reset
   ```

   Then run any extra seeds (e.g. `pnpm glossary:seed-local` if you use it).

4. **Link to production when you have a fresh project** — Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard), then from repo root:

   If you had a project linked before and want to point at the new one:

   ```bash
   supabase unlink   # optional: remove existing link
   supabase link --project-ref <your-new-project-ref>
   supabase db push
   ```

   Project ref is in Dashboard → Project Settings → General. Your `.env.local` stays pointed at local; production (e.g. Vercel) uses the new project's URL and keys.

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

- `NEXT_PUBLIC_SUPABASE_URL` = **API URL** from `supabase status` (e.g. `http://127.0.0.1:54521` — see `supabase/config.toml` [api] port)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key from `supabase status` (often labeled “Publishable” or see Studio → Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` = service role key (often labeled “Secret” or service_role in Studio)

So in local dev, **one** database at the API port (54521 in this config). Both the Next.js app and any seed script (using `.env.local`) use it.

**Local status snapshot:** Run `supabase status` to get current values. Ports come from `supabase/config.toml`: API `54521`, DB `54500`, Studio `54523`. Use the anon and service_role keys in `.env.local` for any app in the monorepo (web, hydaelyn, agent apps) that uses this Supabase project.

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
pnpm glossary:seed-local
```

This uses `supabase status -o env` to get local URL and keys (no manual .env setup needed). Alternatively, set `.env` with local values and run `pnpm glossary:fetch-and-seed`.

### 4. Run the app

```bash
pnpm dev
```

The app and API routes use `.env.local` → local Supabase. No confusion with a remote.

### 5. Troubleshooting: "fetch failed" / self-signed certificate on login

When `supabase/config.toml` has `[api.tls] enabled = true` (for Shopify Customer Account API), the local API uses HTTPS. The default auto-generated cert is self-signed and browsers reject it.

**Recommended fix: use mkcert (locally-trusted certs, no browser prompt):**

1. Install mkcert: `winget install mkcert` (Windows) or `brew install mkcert` (macOS)
2. Run `mkcert -install` once to install the local CA
3. Generate certs: `pnpm supabase:tls-setup`
4. Restart Supabase: `supabase stop` then `supabase start`
5. Retry login — the browser will trust the cert automatically

**Alternative (manual trust):** Open `https://127.0.0.1:54221` in your browser, accept the security warning (Chrome: Advanced → Proceed), then retry login. Must be done once per browser.

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

## Seeding production formulas

`supabase db push` only runs migrations. It does **not** run seed files (`seed.sql`, `seed_formulas.sql`). So the production database has the formulas tables but no formula rows until you seed them.

### One-off (Supabase Dashboard)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your production project → **SQL Editor**.
2. Paste the contents of `supabase/seed_formulas.sql` and run it. If the editor has a size limit, run in chunks (e.g. one formula block at a time).
3. Verify: open production `/formulas` or `GET /api/formulas` and confirm the formula count.

### Repeatable (script)

1. **Database connection** — In Supabase Dashboard → **Project Settings** → **Database**, copy the **Connection string** (URI). Add it to Vercel (or `.env`) as `SUPABASE_DB_URL`. Do not commit this value.
2. **Run the seed**:
   ```bash
   pnpm formulas:seed-production
   ```
   This uses Vercel production env (no secrets written to disk). Alternatively, set `SUPABASE_DB_URL` in `.env` and run:
   ```bash
   tsx scripts/seed-formulas-production.ts
   ```
3. Re-run anytime you want to sync production with the repo's formula seed (e.g. after adding formulas to `seed_formulas.sql`).

---

## Summary

| Target   | Apply migrations with   | App / scripts use env        |
|----------|--------------------------|------------------------------|
| **Local**   | `supabase db reset`       | `.env.local` → local URL/keys |
| **Production** | `supabase db push` (after link) | Vercel / prod env → prod URL/keys |

If the app says `relation "public.fragrance_notes" does not exist` in local dev, the local DB is missing that migration: run `supabase db reset`, then re-run any seeds (e.g. `pnpm glossary:fetch-and-seed`).
