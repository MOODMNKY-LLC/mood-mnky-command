# Vercel Settings Matrix — Monorepo Apps

This document is the **single source of truth** for Vercel project configuration for each deployable app in the repo. Use it to align a new Vercel project or fix a misconfigured one (e.g. wrong root, wrong build, or missing env).

**Key point:** The same commit can succeed for one Vercel project and fail for another. Failures are usually due to **project settings** (Root Directory, Build/Install commands) or **env mismatch**, not monorepo-wide code breakage.

---

## 1. Apps and project names

| App | Workspace path | Package name | Suggested Vercel project name |
|-----|----------------|--------------|-------------------------------|
| **Web (Dojo / Main / LABZ)** | `apps/web` | `web` | `mood-mnky-command` |
| **Hydaelyn (FFXIV)** | `apps/hydaelyn` | `hydaelyn` | `hydaelyn` |
| **MT Portal** | `supabase-mt/portal` | `mt-portal` | `mood-mnky-command-portal` or `mood-mnky-portal` |
| **Flow MNKY** | `apps/flow-mnky` | `flow-mnky` | `flow-mnky` |
| **Code MNKY** | `apps/code-mnky` | `code-mnky` | `code-mnky` |

**Duplicate / accidental project:** If you see a project like `mood-mnky-portal-1772831179209-MBrB` (numeric suffix), it is likely an imported duplicate or misconfigured clone. Compare it to the successful portal project and either **repoint it** using this matrix or **remove/disable** it so only one canonical portal project deploys.

---

## 2. Settings matrix (per project)

Copy these into **Vercel → Project → Settings → General** (and **Environment Variables**). Keep **Root Directory** and **Build/Install** in sync with the app’s `vercel.json` in the repo.

### 2.1 Web — `mood-mnky-command`

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Install Command** | `pnpm install --no-frozen-lockfile` |
| **Build Command** | `cd ../.. && pnpm exec turbo run build --filter=web` |
| **Output Directory** | `.next` |
| **Node.js Version** | 20.x (or match other projects) |

Defined in: `apps/web/vercel.json`.  
**Important:** Install must run from `apps/web` (no `cd ../..` in install) so pnpm creates correct workspace symlinks (e.g. `@mnky/mt-supabase`).

---

### 2.2 Hydaelyn — `hydaelyn`

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/hydaelyn` |
| **Framework Preset** | Next.js |
| **Install Command** | `cd ../.. && pnpm install --no-frozen-lockfile` |
| **Build Command** | `cd ../.. && pnpm exec turbo run build --filter=hydaelyn` |
| **Output Directory** | `.next` |
| **Node.js Version** | 20.x |

Defined in: `apps/hydaelyn/vercel.json`.  
Ensure Vercel env includes: `FFLOGS_CLIENT_ID`, `FFLOGS_CLIENT_SECRET`, `XIVAPI_BASE_URL`, `XIVAPI_API_KEY` (see root `turbo.json` `globalPassThroughEnv`).

---

### 2.3 MT Portal — `mood-mnky-command-portal` or `mood-mnky-portal`

**Use this config when the portal is linked via Supabase dashboard (env synced from Supabase).** Build runs from `supabase-mt/portal` only; no `cd ../..` so the Vercel project does not depend on monorepo root.

| Setting | Value |
|--------|--------|
| **Root Directory** | `supabase-mt/portal` |
| **Framework Preset** | Next.js |
| **Install Command** | `pnpm install` |
| **Build Command** | `pnpm build` |
| **Output Directory** | `.next` |
| **Node.js Version** | 20.x |

Defined in: `supabase-mt/portal/vercel.json`. Portal `next.config.ts` includes `transpilePackages: ["@mnky/mt-supabase"]` so the workspace package resolves.

**Required environment variables (portal):**  
The portal’s `scripts/check-env.mjs` and runtime expect at least:

- `NEXT_PUBLIC_SUPABASE_MT_URL`
- `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`
- `SUPABASE_MT_SERVICE_ROLE_KEY`

Set these in **Vercel → Settings → Environment Variables** for Production (and Preview if needed). If one portal project succeeds and another fails on the same commit, **diff env** between the two projects and ensure the failing one has these three (and any other Supabase/OpenAI vars the portal uses). See `supabase-mt/portal/.env.example` for the full list.

---

### 2.4 Flow MNKY — `flow-mnky`

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/flow-mnky` |
| **Framework Preset** | Next.js |
| **Install Command** | `cd ../.. && pnpm install` |
| **Build Command** | `cd ../.. && pnpm exec turbo run build --filter=flow-mnky` |
| **Output Directory** | `.next` |
| **Node.js Version** | 20.x |

Defined in: `apps/flow-mnky/vercel.json`.

---

### 2.5 Code MNKY — `code-mnky`

| Setting | Value |
|--------|--------|
| **Root Directory** | `apps/code-mnky` |
| **Framework Preset** | Next.js |
| **Install Command** | `cd ../.. && pnpm install` |
| **Build Command** | `cd ../.. && pnpm exec turbo run build --filter=code-mnky` |
| **Output Directory** | `.next` |
| **Node.js Version** | 20.x |

Defined in: `apps/code-mnky/vercel.json`.

---

## 3. Environment variables

- **Turbo:** Any env var that affects build output or runtime must be listed in root `turbo.json` → `globalPassThroughEnv` so Turbo cache and Vercel see them. See `turbo.json` for the full list.
- **Per-app required:** Each app may need a subset (e.g. portal requires the three Supabase MT vars above). Copy from root `.env.example` and `supabase-mt/portal/.env.example` (or app-specific `.env.example`) into the correct Vercel project.
- **Parity check:** If project A succeeds and project B fails on the same commit, compare **Root Directory**, **Build/Install**, and **Environment Variables** between A and B; align B to A using this matrix.

---

## 4. Fixing a failing project (checklist)

1. **Confirm Root Directory**  
   Must match the app’s path (e.g. `supabase-mt/portal` for portal, `apps/web` for web). Wrong root → wrong build or “no Next.js” behavior.

2. **Match build/install to this matrix**  
   Copy Install Command and Build Command from the section above for that app. Ensure they match the app’s `vercel.json` or the chosen alternative (e.g. portal minimal).

3. **Compare env to a successful project**  
   For the same app (e.g. portal), open the **successful** Vercel project’s Environment Variables and ensure the **failing** project has at least the same keys (especially required ones like the three portal Supabase MT vars).

4. **Remove or fix duplicates**  
   If an extra project (e.g. `mood-mnky-portal-1772831179209-MBrB`) is not a deliberate target, either delete it or reconfigure it using this matrix so it matches the canonical portal project.

5. **Redeploy**  
   After changing Root Directory or Build/Install, trigger a new deployment (push or “Redeploy” in Vercel). For stubborn cache issues, use “Redeploy” with “Clear cache and redeploy”.

---

## 5. Repo-level notes (not the first fix)

- **Env sprawl:** `turbo.json` has a large `globalPassThroughEnv` list. Keep Vercel env in sync so projects don’t silently diverge.
- **Version drift:** Some workspace apps use different major/minor versions of shared deps (e.g. `@supabase/ssr`, `@supabase/supabase-js`, Tailwind). Normalizing versions over time will reduce “one app builds, another doesn’t” surprises.
- **TypeScript:** `apps/web/next.config.mjs` has `typescript.ignoreBuildErrors: true`. Consider turning this off and fixing errors so regressions show in CI/Vercel instead of only at runtime.

---

## 6. References

- Root `vercel.json`: installCommand for repo-root builds; used when no app-specific root is set.
- App-level `vercel.json`: `apps/web`, `apps/hydaelyn`, `supabase-mt/portal`, `apps/flow-mnky`, `apps/code-mnky`.
- Portal env check: `supabase-mt/portal/scripts/check-env.mjs`.
- Portal env example: `supabase-mt/portal/.env.example`.
- Monorepo deployment overview: root `README.md` → “Monorepo deployment (Vercel)”.
