# Vercel monorepo deployment reference

Single source of truth for Vercel project settings when deploying apps from this repo. Use the Vercel CLI to inspect failures: `vercel list --status ERROR` then `vercel inspect <url> --logs`.

## Main app (www.moodmnky.com) — project: mood-mnky-command

- **Root Directory:** `apps/web`
- **Install Command:** (use repo root `vercel.json`: `pnpm install --no-frozen-lockfile`; Vercel runs this from repo root when Root Dir is `apps/web` only if build command cds to root)
- **Build Command:** `cd ../.. && pnpm install && pnpm turbo build --filter=web`
- **Critical:** `apps/web/next.config.mjs` must include `transpilePackages: ["@mnky/mt-supabase"]` so the workspace package resolves during the Vercel build. Without it, the build fails with "Module not found: Can't resolve '@mnky/mt-supabase'".
- **Environment:** Add any build-time or runtime vars in the Vercel dashboard. For Turbo cache correctness, also list build-affecting vars in root `turbo.json` `globalPassThroughEnv` (otherwise Turbo warns and vars may not be available to the app).

## Other apps (separate Vercel projects, if used)

| App | Root Directory | Build command (from repo) |
|-----|----------------|---------------------------|
| **hydaelyn** | Repo root | `pnpm exec turbo run build --filter=hydaelyn` (see `apps/hydaelyn/vercel.json`) |
| **flow-mnky** | `apps/flow-mnky` | `cd ../.. && pnpm exec turbo run build --filter=flow-mnky` |
| **code-mnky** | `apps/code-mnky` | `cd ../.. && pnpm exec turbo run build --filter=code-mnky` |
| **mt-portal** | `supabase-mt/portal` | `cd ../.. && pnpm install` then `pnpm run build` in portal (see `supabase-mt/portal/vercel.json`) |

Each of these has a `vercel.json` in its directory; when linking a Vercel project to that directory, use the install/build commands from that file (or the table above).

## Debugging failed deployments

1. `vercel list` — list recent deployments (optional: `--status ERROR`).
2. `vercel inspect <deployment-url> --logs` — print build logs for that deployment.
3. Ensure Root Directory and build command match this doc; ensure workspace packages (e.g. `@mnky/mt-supabase`) are either in `transpilePackages` (Next.js) or otherwise resolvable from the app being built.
