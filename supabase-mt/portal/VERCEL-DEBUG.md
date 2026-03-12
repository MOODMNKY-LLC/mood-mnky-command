# Portal Vercel deploy debug

## Failure 1: No Next.js detected (old deploy, 5d ago)

```bash
cd supabase-mt/portal && vercel inspect portal-4lvuz1bt4-mood-mnkys-projects.vercel.app --logs
```

**Error:** Install ran `cd ../.. && pnpm install` → then **"No Next.js version detected"**.

**Cause:** With `cd ../..`, framework detection ran at monorepo root, where `package.json` has no `next`.

**Fix in repo:** `vercel.json` now uses `pnpm install` and `pnpm build` (no `cd ../..`).

---

## Failure 2: pnpm install ERR_INVALID_THIS (deploy from CLI)

When running `vercel --prod` from the **portal directory**, Vercel uploads only the portal (e.g. 225 files), not the full monorepo. So:

- There is no `pnpm-workspace.yaml` or `@mnky/mt-supabase` in the upload.
- `pnpm install` can hit registry errors (e.g. `ERR_PNPM_META_FETCH_FAIL` / `ERR_INVALID_THIS`).

**Correct way to deploy:** Use **Git integration** (connect the repo in Vercel, set **Root Directory** to `supabase-mt/portal`). Then each push to the linked branch clones the **full repo**; the build runs in `supabase-mt/portal` but the clone includes the monorepo root, so pnpm finds the workspace and `@mnky/mt-supabase` resolves.

Do **not** rely on `vercel deploy` from inside `supabase-mt/portal` for production; that uploads only the portal and breaks the workspace.

**Optional:** `.nvmrc` with `20` pins Node on Vercel; can help avoid runtime/registry quirks.

---

## Checklist (Vercel dashboard)

1. **Root Directory:** `supabase-mt/portal`
2. **Build/Install:** use repo `vercel.json` (Install: `pnpm install`, Build: `pnpm build`)
3. **Env:** required `NEXT_PUBLIC_SUPABASE_MT_URL`, `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY`, `SUPABASE_MT_SERVICE_ROLE_KEY` (Supabase sync usually provides these)
4. Trigger **Redeploy** from the Vercel project (or push a commit to the connected branch)

## Re-run debug on a new failure

```bash
cd supabase-mt/portal
vercel ls
vercel inspect <deployment-url> --logs
```

Replace `<deployment-url>` with the URL from `vercel ls` (e.g. `portal-xxxxx-mood-mnkys-projects.vercel.app`).
