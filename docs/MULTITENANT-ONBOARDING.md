# Multi-Tenant Supabase (MT) — Official Onboarding

This is the **structured onboarding runbook** for the dedicated multi-tenant Supabase project. Use it for a new developer, a fresh clone, or after resetting local Supabase.

## Prerequisites

- Repo root is `mood-mnky-command`
- Main Supabase (single-tenant) can be running or stopped; MT runs as a **separate** local project
- You have a **main Supabase auth user id** (for provisioning the first tenant as owner). Example local: `3f7bff49-abcf-409c-8fef-4748c593d383`. For dev overseer (Overseer API from main app): `92e73dfc-ee3b-445b-b7dc-95d4b8dde6d9` is in `platform_owner_external_users`; add yours with `pnpm switch-mt-dev-owner YOUR_UUID`. Get UUID from main Supabase Studio → Authentication → Users or `/api/me` when logged in.

---

## 1. Start the MT project locally

From **repo root** (do not `cd` into `supabase-mt`):

```bash
pnpm supabase-mt:start
# or
supabase start --workdir supabase-mt
```

- **MT Studio:** http://127.0.0.1:54525  
- **Main project** (if you start it): `pnpm supabase:start` → http://127.0.0.1:54523 — different DB.

---

## 2. Add MT env vars to `.env.local`

From the CLI output (or run `supabase status --workdir supabase-mt`), copy into `.env.local`:

| Variable | Value (from MT output) |
|----------|------------------------|
| `NEXT_PUBLIC_SUPABASE_MT_URL` | API URL (e.g. `http://127.0.0.1:54522`) |
| `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY` | anon key |
| `SUPABASE_MT_SERVICE_ROLE_KEY` | service_role key |

Optional: `SUPABASE_MT_PROJECT_REF` (for linking production later).

---

## 3. Apply migrations (if not already applied)

Migrations run automatically on `supabase-mt:start` for a fresh start. If you added new migrations:

- **Local:** Restart with `pnpm supabase-mt:stop` then `pnpm supabase-mt:start`, or run `supabase db reset --workdir supabase-mt` (from repo root).
- **Production:** See [Linking to production](#linking-to-production) below.

---

## 4. Provision the first tenant (MOOD MNKY LLC)

From **repo root**, run (replace the UUID with your **main** Supabase user id):

```bash
pnpm provision-mt-tenant --slug mood-mnky --name "MOOD MNKY LLC" --owner-id 3f7bff49-abcf-409c-8fef-4748c593d383 --platform-owner --seed-organization
```

- **PowerShell:** Use the raw UUID; do not use angle brackets.
- **Owner ID:** Must be a user that exists in your **main** Supabase Auth (so they can use the Overseer API when logged into the main app).

The script prints JSON including `tenantId`. **Record that `tenantId`** in:

- [MULTITENANT-SCOPE-REGISTER.md](MULTITENANT-SCOPE-REGISTER.md) (Default tenant UUID)
- Any internal runbook or env (e.g. `NEXT_PUBLIC_MT_DEFAULT_TENANT_SLUG` is already `mood-mnky`; the UUID is for scripts/backfill).

---

## 5. Verify

- **MT Studio** (http://127.0.0.1:54525): Tables `tenants`, `tenant_members`, `tenant_brand_copy`, `tenant_design_tokens`, `tenant_content`, `platform_owner_external_users` — one tenant row for `mood-mnky`, one member, and seed rows.
- **Agent apps:** Run an agent app (e.g. `pnpm --filter mood-mnky dev`); the landing page should resolve default tenant and show MT-driven copy if configured.

---

## Linking to production

When you create a **new** MT project in the Supabase Dashboard:

1. Create the project; note the **Project reference** (Settings → General).
2. From repo root:
   ```bash
   cd supabase-mt && supabase link --project-ref YOUR_MT_PROJECT_REF
   ```
3. Push migrations:
   ```bash
   supabase db push
   ```
4. In Dashboard → Settings → API, copy **Project URL**, **anon key**, and **service_role key** into your production env (e.g. Vercel) as `NEXT_PUBLIC_SUPABASE_MT_URL`, `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`, `SUPABASE_MT_SERVICE_ROLE_KEY`.
5. Provision the first tenant on **production** using the same command as in step 4, with the **production main Supabase** user UUID and production MT env vars. That adds the provisioner as the first overseer in prod.

---

## Production: overseer UUIDs (cannot copy from dev)

The Overseer API (Tenants, App Instances) checks `is_overseer(user_id)` in the **MT** project. When users log in via the **main** app (main Supabase), their user ID lives in **main** Supabase auth, not in MT. The table `platform_owner_external_users` in the **MT** project stores those main-auth user IDs so they can still act as overseers.

- **Dev and prod use different auth databases.** Main Supabase (dev) has different user UUIDs than main Supabase (prod). You cannot copy UUIDs from dev to prod; they refer to different users.
- **First overseer in production:** When you run `provision-mt-tenant ... --owner-id <UUID> --platform-owner` **against production** (with production MT URL and service role in env), use the **production** main Supabase user UUID. Get it from production main Supabase Dashboard → Authentication → Users, or from your production app’s `/api/me` when logged in. The script inserts that UUID into production MT’s `platform_owner_external_users`.
- **Additional overseers in production:** Add each production main-Supabase user UUID to the **production** MT project’s `platform_owner_external_users` table. Options:
  1. **Script (recommended):** From repo root, with **production** MT env vars set (e.g. in `.env.production` or CI secrets), run:
     ```bash
     pnpm add-mt-overseer <PRODUCTION_MAIN_USER_UUID>
     ```
     Use the same env loading as your prod deploy (e.g. `dotenv -e .env.production -- tsx scripts/add-mt-overseer.ts <UUID>` if MT vars are in `.env.production`).
  2. **MT Studio (production):** Open the production MT project in Supabase Dashboard → Table Editor → `platform_owner_external_users` → Insert row → set `external_user_id` to the production main Supabase user UUID.
  3. **SQL in MT project:** In production MT SQL Editor, run:
     ```sql
     insert into public.platform_owner_external_users (external_user_id) values ('<PRODUCTION_MAIN_USER_UUID>') on conflict (external_user_id) do nothing;
     ```

---

## Quick reference

| Step | Command / action |
|------|------------------|
| Start MT locally | `pnpm supabase-mt:start` (from repo root) |
| MT Studio | http://127.0.0.1:54525 |
| Stop MT | `pnpm supabase-mt:stop` |
| First tenant (local example) | `pnpm provision-mt-tenant --slug mood-mnky --name "MOOD MNKY LLC" --owner-id 3f7bff49-abcf-409c-8fef-4748c593d383 --platform-owner --seed-organization` |
| Add dev overseer (main-app auth) | `pnpm switch-mt-dev-owner YOUR_UUID` or `pnpm add-mt-overseer YOUR_UUID` (local MT env) |
| Add overseer in production | Use **production** MT env vars, then `pnpm add-mt-overseer <PRODUCTION_MAIN_USER_UUID>`; or insert into MT Studio / SQL (see [Production: overseer UUIDs](#production-overseer-uuids-cannot-copy-from-dev)) |
| Record tenantId | Update [MULTITENANT-SCOPE-REGISTER.md](MULTITENANT-SCOPE-REGISTER.md) and runbooks |

---

## References

- [supabase-mt/README.md](../supabase-mt/README.md) — MT project overview and ports
- [ENV-MULTITENANT-SUPABASE.md](ENV-MULTITENANT-SUPABASE.md) — Env vars and provisioning options
- [MULTITENANT-SCOPE-REGISTER.md](MULTITENANT-SCOPE-REGISTER.md) — Default tenant UUID and scope rules
- [admin/SUPABASE-LOCAL-AND-PRODUCTION.md](admin/SUPABASE-LOCAL-AND-PRODUCTION.md) — Local vs production and linking
