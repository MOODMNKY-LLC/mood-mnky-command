# Agent Apps (MOOD MNKY, SAGE MNKY, CODE MNKY)

Three Next.js apps in the monorepo, each themed and structured for its agent persona. They share the Main design system baseline and a single Supabase instance with consolidated auth.

**Related:** [INTEGRATIONS-MASTER.md](../INTEGRATIONS-MASTER.md) (parent programs and integrations); [.env.master.example](../.env.master.example) (env var layout; do not commit real secrets). Each app has a **Roadmap** page (`/roadmap`) with Mermaid diagrams for ecosystem, app phases, and integrations.

## Apps

| App | Path | Port | Theme | Purpose |
|-----|------|------|--------|---------|
| **MOOD MNKY** | `apps/mood-mnky` | 3011 | Grayscale (`data-theme="main"`) | Brand ambassador, refined minimalist, fragrance narrative |
| **SAGE MNKY** | `apps/sage-mnky` | 3012 | Green dominant (`data-theme="sage"`) | Wisdom-focused advisor, guidance, reflection, decision support |
| **CODE MNKY** | `apps/code-mnky` | 3013 | Blue dominant (`data-theme="code"`) | DevOps and coding companion, snippets, step-by-step guidance |

## Design system

- **Baseline**: Same layout and token contract as the Main section in `apps/web`: `--main-page-width`, `--main-section-gap`, `--main-glass-*`, `.main-container`, `.main-glass-panel`, glass nav/footer. See [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- **Palettes**: MOOD uses Main grayscale; SAGE uses green for primary/accent; CODE uses blue. Each app sets `data-theme` on `<html>` in its root layout.
- **Styling**: Tailwind CSS, minimal shadcn (Button), agent-specific Nav/Footer/Hero/GlassCard components.

## Auth and Supabase

- **Single Supabase**: All three apps use the same `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from repo root `.env` / `.env.local`; turbo passes them).
- **Sign in**: Each app’s “Sign in” link points to the main auth entry (e.g. `NEXT_PUBLIC_MAIN_AUTH_URL` or `https://mnky-command.moodmnky.com/auth`) so one place manages sign-up/sign-in. No multi-tenancy; same `profiles` and session across the ecosystem.
- **Database**: No new tables. For future agent-scoped data (e.g. SAGE reflections, CODE snippets), add tables with `profile_id` and optionally `app_slug` or `agent_id`; do not introduce full org-based multi-tenancy unless required. See [CHATGPT-SUPABASE-MULTITENANT-DISCUSSION.md](../CHATGPT-SUPABASE-MULTITENANT-DISCUSSION.md).

## Running

From repo root:

- **One app**: `pnpm --filter mood-mnky dev` (or `sage-mnky`, `code-mnky`). MOOD runs on 3011, SAGE on 3012, CODE on 3013.
- **Build**: `pnpm --filter mood-mnky build` (same for other apps). Root `pnpm build` runs turbo and will build all apps including these if configured in the pipeline.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` – shared Supabase (required for auth if you add protected routes).
- `NEXT_PUBLIC_MAIN_AUTH_URL` – main app auth URL for “Sign in” redirect (optional; defaults to mnky-command.moodmnky.com/auth).
- `NEXT_PUBLIC_MAIN_APP_URL` – main site URL for footer/nav links and 3D avatar assets at `/verse/{agent}-mnky-3d.png` (optional; defaults to www.moodmnky.com).

## Proxy / deployment

If agent apps are deployed under subdomains (e.g. mood.moodmnky.com, sage.moodmnky.com, code.moodmnky.com), configure host-based rewrites in your edge or in `apps/web/proxy.ts` if they are served from the same deployment. Otherwise deploy each app as a separate Vercel (or other) project and set the env vars per project.
