# Vercel NOT_FOUND (404) — MNKY-MUZIK Astro on Vercel

This doc explains the **NOT_FOUND** error when deploying MNKY-MUZIK (Astro) to Vercel, how to fix it, and how to avoid it in the future.

**Reference:** [Vercel NOT_FOUND docs](https://vercel.com/docs/errors/NOT_FOUND)

---

## 1. Suggested fix

### Fix A — `output: "static"` with `prerender = false` (current MNKY-MUZIK case)

If you already use `@astrojs/vercel` but **every route returns 404**, the cause is usually:

- **Config:** `output: "static"` in `astro.config.mjs`.
- **Pages:** Many or all pages have `export const prerender = false` (e.g. index, library, playlist/[id], API routes).

**What to do:** Use server (or hybrid) output so Vercel gets serverless handlers for on-demand routes.

1. In `astro.config.mjs` set:
   ```js
   output: "server",  // or "hybrid" if you want some pages pre-rendered
   ```
2. Keep `adapter: vercel()`.
3. Redeploy. The Vercel adapter will emit serverless functions for each `prerender = false` route.

### Fix B — Wrong adapter (Node on Vercel)

**Use the Vercel adapter instead of the Node adapter when deploying to Vercel.**

- **Wrong setup:** `@astrojs/node` with `mode: "standalone"` → builds a **long‑running Node server**.
- **What Vercel expects:** Either **static files** in `outputDirectory`, or **serverless functions** produced by `@astrojs/vercel`.

**Option B1 — Use Vercel adapter (recommended for Vercel):**

1. In `astro.config.mjs`:
   - Remove: `import node from "@astrojs/node"` and `adapter: node({ mode: "standalone" })`.
   - Add: `import vercel from "@astrojs/vercel"` and `adapter: vercel()`.
   - Use `output: "server"` (or `"hybrid"`) if you have `prerender = false` pages.
2. Remove `@astrojs/node` if unused: `pnpm remove @astrojs/node`.
3. Redeploy on Vercel.

**Option B2 — Deploy Node app elsewhere:**

- Deploy to a platform that runs a Node server (e.g. **Railway**, **Fly.io**, **Render**).  
- Keep `@astrojs/node` and run the built server (e.g. `node dist/server/entry.mjs`).

---

## 2. Root cause

### Cause 1: `output: "static"` with `prerender = false` (adapter correct, output wrong)

- **What it’s doing:** The app is built with `output: "static"` and `adapter: vercel()`. Pages and API routes use `export const prerender = false`. In **static** mode, Astro only emits **pre-rendered** files; it does **not** emit serverless functions for `prerender = false` routes.
- **What Vercel is doing:** Vercel looks in `dist` for either a **static file** for that path or a **serverless handler**. For `/`, `/library`, `/playlist/xyz`, `/api/...`, etc., there is no static file (those routes weren’t pre-rendered) and no serverless function (static build doesn’t create any).
- **Result:** Every request for a `prerender = false` route gets **NOT_FOUND** (404).

### Cause 2: Node adapter on Vercel (wrong adapter)

- **What it’s doing:** The app is built with `output: "hybrid"` (or `"server"`) and `adapter: node({ mode: "standalone" })`. The build produces a **Node server** (e.g. `dist/server/entry.mjs`) and static assets.
- **What Vercel is doing:** Vercel does **not** start that Node process. It only serves static files from `dist` or invokes serverless functions. No serverless functions are emitted by the Node adapter.
- **Result:** Any route that would be handled by the Node server returns **NOT_FOUND** (404).

### Conditions that trigger this error

1. **Output vs prerender:** `output: "static"` with one or more pages/API routes that have `prerender = false` → those routes have no static file and no serverless handler on Vercel.
2. **Adapter:** Using `@astrojs/node` on Vercel (standalone or middleware) → no serverless handlers.
3. **Platform:** Deploying to Vercel (static + serverless only; it does not run a long-lived Node server).
4. **Request:** Any URL that isn’t a pre-rendered static file and has no serverless handler.

### Misconception / oversight

- **“If the build succeeds and `dist` exists, Vercel will run my app.”**  
  Vercel only serves static assets or serverless functions. It does not run a Node server. With `output: "static"`, routes that are not pre-rendered never get a handler, so they 404.
- **“Using the Vercel adapter is enough.”**  
  You also need an **output mode** that emits serverless functions when you have on-demand routes: use `output: "server"` or `output: "hybrid"`, not `output: "static"`, if any page has `prerender = false`.

---

## 3. Underlying concept

### Why this error exists and what it protects

- **NOT_FOUND** means: “No resource or handler was found for this URL.”
- It protects you from **assuming** a handler exists when the platform never registered one (e.g. no static file, no serverless route). So the platform fails explicitly instead of hanging or misrouting.

### Correct mental model

- **Output mode = “what the build produces”.**
  - **`output: "static"`** → Only pre-rendered files. No server. Routes with `prerender = false` are **not** built as static files and get **no** serverless function.
  - **`output: "server"`** → All routes are on-demand; the adapter emits serverless functions for every route.
  - **`output: "hybrid"`** → Pre-rendered where `prerender = true`, serverless where `prerender = false`.
- **Adapter = “how that output is shaped for the host”.**
  - **Node adapter** → “Build a Node server.” Good for: Node hosts (VPS, Railway, Fly, Render, etc.).
  - **Vercel adapter** → “Turn on-demand routes into serverless functions + static assets for Vercel.” Only produces those functions when output is **server** or **hybrid** (not when output is **static**).
- **Host model (Vercel):**
  - **Static:** Serves files from `dist`. No server process.
  - **Serverless:** Runs your code per request. No long‑running server. **Vercel does not run a Node server.**

### How this fits framework/platform design

- Astro is **host‑agnostic**: you choose an **adapter** that matches your **deployment target**.
- Vercel’s contract is **static + serverless**. So on Vercel you must use an adapter that emits that contract (e.g. `@astrojs/vercel`), not one that emits a Node server.

---

## 4. Warning signs and similar mistakes

### What to look for

- **Adapter vs host mismatch:** Node/Deno/Netlify/etc. adapter on a host that doesn’t run that runtime in the way the adapter expects.
- **“Build succeeded but every route is 404”** on Vercel → strong signal the output is a server, not static/serverless.
- **Docs say “for Vercel use X adapter”** but you’re using a different adapter (e.g. Node).

### Similar mistakes

- Using **Netlify adapter** on Vercel (or the reverse).
- **`output: "static"`** while many pages or API routes have **`prerender = false`** → those routes have no handler on Vercel.
- Assuming **rewrites in vercel.json** can “point” to a Node server; they can’t start one, so you still get NOT_FOUND for dynamic routes.

### Code smells / patterns

- `output: "static"` in `astro.config.mjs` and one or more pages with `export const prerender = false` → expect 404 for those routes on Vercel.
- `adapter: node(...)` in the same repo that’s deployed to Vercel.
- No `@astrojs/vercel` when the deployment target is Vercel and you have on-demand routes.
- README or CI says “deploy to Vercel” but config uses only the Node adapter or static output with on-demand pages.

---

## 5. Alternatives and trade-offs

| Approach | Trade-off |
|----------|-----------|
| **`output: "server"` + Vercel adapter (Fix A)** | All `prerender = false` routes become serverless; no static files for those URLs. Correct when you need on-demand rendering or API routes. |
| **`output: "hybrid"` + Vercel adapter** | Mix: pre-rendered where `prerender = true`, serverless where `prerender = false`. Use when some pages can be static and others need server. |
| **`output: "static"` only** | No serverless. Only use if **every** page can be pre-rendered (no `prerender = false`). No API routes that need server logic. |
| **Deploy Node build elsewhere (Fix B2)** | Use Node adapter and deploy to Railway, Fly, Render, etc. No change to output/adapter logic. |
| **Keep Node on Vercel** | Not supported. You’ll get NOT_FOUND for server-handled routes. |

**Recommendation:** For MNKY-MUZIK on Vercel with `prerender = false` on pages and API routes, use **`output: "server"`** (or **`output: "hybrid"`**) with **`adapter: vercel()`**. Avoid **`output: "static"`** unless every route is pre-rendered.

---

## 6. Domain mapping and build integrity

NOT_FOUND can also mean **no production deployment is bound to that hostname**, or that **build integrity** (e.g. submodules) is broken. Fix these in addition to output/adapter.

### 6.1 Domain ↔ project mapping (NOT_FOUND on your custom domain)

If `muzik.moodmnky.com` (or your custom domain) shows Vercel’s generic NOT_FOUND:

1. **Vercel Project → Settings → Domains**
2. **Add** `muzik.moodmnky.com` (or the domain you use).
3. Confirm **Valid Configuration** and assign it to **Production**.
4. Even if the build is failing, claim the domain on the correct project so that once the build is fixed, the domain serves your app.

### 6.2 Submodule fetch failure (“Failed to fetch one or more git submodules”)

Vercel clones the main repo but won’t fetch submodules without the right setup. If submodules fail, the project can be incomplete → no valid deployment → NOT_FOUND or broken app.

**What we had:** An **orphaned submodule** `apps/v0-mcp` (indexed as submodule, **no `.gitmodules`**). Git reported “no submodule mapping found” and Vercel “Failed to fetch one or more git submodules.”

**Fix applied:** `git rm --cached apps/v0-mcp` to remove the broken submodule reference. Commit and redeploy. `git submodule status` should run clean.

**If you use real submodules later:**

- Prefer **HTTPS** URLs in `.gitmodules` (not `git@github.com:...`). Vercel often doesn’t have SSH keys.
- Ensure the Vercel Git integration has access to each submodule repo (e.g. Vercel app authorized for those GitHub repos).
- **Option A (least drama):** Replace submodules with workspace packages (`packages/*`), git subtree, or a private package. No submodules on Vercel.

### 6.3 Supabase CLI and Vercel build

Do **not** install or run the Supabase CLI as part of the Vercel build. Use it only locally or in CI (e.g. `supabase db push`, `supabase gen types`).

**What we do:**

- **Install:** Use filtered install so only the app being built (and its deps) are installed. mnky-muzik: `--filter @mnky/mnky-muzik...`; root / mnky-verse: `--filter mnky-verse...`. That avoids installing trvlr-sync and the Supabase CLI on Vercel.
- **Build:** No `supabase` commands run during the Vercel build (e.g. mnky-muzik: `astro build`).

### Quick checks

| Check | Command |
|-------|--------|
| Submodules | `git submodule status` — should be empty or list initialized submodules only. |
| Sync submodules | `git submodule sync --recursive` then `git submodule update --init --recursive`. If you get auth or “no mapping” errors locally, Vercel will fail too. |
| Domain | Vercel Project → Settings → Domains — your custom domain added and **Valid Configuration**. |

### 6.4 Other Vercel build warnings (non-fatal)

These often appear in logs; they come from dependencies or environment and **do not fail the build**:

- **`[DEP0169] url.parse()` deprecation** — From a dependency; use WHATWG `URL` upstream. Safe to ignore for now.
- **`node_modules is present. Lockfile only installation will make it out-of-date`** — Typically when using frozen lockfile with cached `node_modules`. Use `--no-frozen-lockfile` in install if you need to avoid it.
- **`deprecated` / `peer dependencies`** — From nested packages (e.g. eslint, next, minimatch). Update deps over time.
- **Vite `as: 'raw'` deprecated** — Emitted by Astro/Vite deps; use `query: '?raw', import: 'default'` upstream. Build still succeeds.
- **Supabase bin ENOENT** — Use **filtered install** (`--filter <app>...`) so the Supabase CLI (trvlr-sync) isn’t installed. See §6.3.

### 6.5 Recent deployment errors (mnky-muzik, resolved)

From Vercel deployment history (list deployments → build logs):

| Error | Cause | Fix applied |
|-------|--------|-------------|
| **ERR_PNPM_OUTDATED_LOCKFILE** — “lockfile not up to date with \<ROOT\>/apps/mnky-forge/package.json” | Full `pnpm install` with **frozen** lockfile while lockfile didn’t match mnky-forge (or other apps). | Use **`--no-frozen-lockfile`** in install. Prefer **filtered install** (`--filter @mnky/mnky-muzik...`) so only mnky-muzik deps are installed; lockfile vs other apps no longer relevant for that build. |
| **Failed to fetch one or more git submodules** | Orphaned submodule ref `apps/v0-mcp` (no `.gitmodules`). | **`git rm --cached apps/v0-mcp`** and deploy. See §6.2. |
| **Deployment ERROR** after “relax lockfile” (install OK, Astro build completed) | Likely **Vercel adapter** step (e.g. bundling serverless) or post-build failure. Build log ended with A11y warnings; actual adapter error may not appear in retrieved logs. | We fixed NOT_FOUND and install scope: **`output: "server"`**, **filtered install**, **submodule removal**. All subsequent mnky-muzik deploys **READY**. |

**Lockfile hygiene:** After changing any app’s `package.json`, run **`pnpm install`** at repo root and commit **`pnpm-lock.yaml`**. That avoids `ERR_PNPM_OUTDATED_LOCKFILE` when a deploy uses a full install (no filter).

**Quick verification:** Use Vercel MCP `list_deployments` (projectId `prj_vvshqKpe3hQydzk0EExIkK8GanVm`, teamId `team_4VdnVxvnFkQg6uxXYa1mNpsN`) and `get_deployment_build_logs` for any failed deployment to inspect logs.

### 6.6 500 Internal Server Error (runtime)

If the **build** succeeds but visiting the site returns **500**, the serverless function is throwing at **runtime**. Common causes and fixes:

1. **Missing Supabase env vars** — `src/lib/supabase.ts` and `src/lib/supabase-server.ts` throw if `PUBLIC_SUPABASE_URL` or `PUBLIC_SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY` for server-only) are missing. Add them in **Vercel → Project → Settings → Environment Variables** for **Production** (and Preview). **Redeploy** after adding or changing env vars; changes only apply to new deployments ([Vercel docs](https://vercel.com/docs/environment-variables/managing-environment-variables)).

2. **`artists` table missing** — The homepage calls `getArtists()`, which queries the normalized `artists` table (Phase 3). If that migration has not been run in production Supabase, the query fails and previously caused 500. **Fix applied:** `getArtists()` now returns `[]` on Supabase error so the homepage still loads; the “Your favorite artists” section is empty until the migration is run.

3. **`PUBLIC_APP_URL`** — Optional. Used where a canonical app URL is needed (e.g. Navidrome callback); the app falls back to `window.location.origin` where possible. You do **not** need to set it for the site to load; set it only if you need a fixed base URL (e.g. `https://muzik.moodmnky.com`).

4. **Seeing the actual error** — In **Vercel → Logs** (or `vercel logs <deployment-url>`), check runtime logs for the thrown message (e.g. “Missing PUBLIC_SUPABASE_URL…”, or Supabase/Postgres errors). [Vercel Function Logs](https://vercel.com/docs/functions/logs).

### 6.7 Navidrome sync: "0 synced, N errors"

If **Sync Tracks from Navidrome** (admin sync page) shows **0 synced, 76 errors** (or similar) and each log line is "Error syncing: [track title]", the sync is failing because the **`tracks`** table is missing columns the sync expects: **`navidrome_track_id`** and **`navidrome_cover_art_id`**. The initial playlists migration only created `tracks` with `title`, `album`, `artist_names`, `duration_text`, etc.; it did not add Navidrome-specific columns.

**Fix:** Add the Navidrome columns to `tracks`. Either run the migration from repo root when the CLI can connect:

```bash
npx supabase db push
```

Or run this SQL in **Supabase Dashboard → SQL Editor → New query**:

```sql
-- Add Navidrome identifiers to tracks (required by Navidrome sync)
alter table public.tracks
  add column if not exists navidrome_track_id text,
  add column if not exists navidrome_cover_art_id text;

comment on column public.tracks.navidrome_track_id is 'Navidrome song id; used to skip already-synced and avoid duplicates.';
comment on column public.tracks.navidrome_cover_art_id is 'Navidrome coverArt id for cover art API.';

create unique index if not exists tracks_navidrome_track_id_key
  on public.tracks (navidrome_track_id)
  where navidrome_track_id is not null;

create index if not exists tracks_navidrome_track_id_idx
  on public.tracks using btree (navidrome_track_id)
  where navidrome_track_id is not null;
```

After applying, run **Sync All Tracks** again; syncs should succeed.

**Migration repair (when CLI works):** If you applied the Phase 3 migration (artists/albums) or this navidrome-columns migration via the dashboard, the CLI won't know. When the Supabase CLI can connect again, from repo root run:

```bash
npx supabase migration repair --status applied 20250201120000
npx supabase migration repair --status applied 20250201130000
```

so future `supabase db push` doesn't try to re-apply them.
