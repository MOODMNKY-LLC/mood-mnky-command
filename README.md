# MOOD MNKY Command (mood-mnky-command)

Bespoke fragrance in the MNKY ecosystem: the Dojo (storefront and community), Blending Lab, and MNKY LABZ in one codebase.

![MOOD MNKY](apps/web/public/mood-mnky-icon.svg)

---

## What This Repo Is

This repository is a **monorepo** containing:

- **Next.js app** — One app, three surfaces: **Main** (brand/marketing), **The Dojo** (storefront + member hub: catalog, cart, blog, Blending Lab, community), and **MNKY LABZ** (dashboard); deployed on Vercel.
- **Shopify theme** — Liquid theme in `Shopify/theme/` (Dawn-derived) for the store; links to the app for the Dojo and Community.
- **Theme app extension** — `extensions/mood-mnky-theme/` for app blocks (Blending CTA, Fragrance Finder, Subscription CTA) and app embed.
- **Supabase** — Backend for Dojo blog, auth, and other data; optional Edge Functions in `supabase/functions/`.

The store (Shopify theme) and the app (Next.js) share the same Shopify catalog via the Storefront API. The Dojo is the **storefront and community** (public shop, blog, agents) plus the user’s **private** hub (preferences, default agent) at `/dojo/me`. **Community** is the public touchpoints (Discord, store blog, Dojo blog).

The **Dojo storefront** is built with **Next.js + Hydrogen React** and the Shopify Storefront API (Shopify’s “bring your own stack” path). It is not a Remix Hydrogen app and does not use Oxygen; no `create-hydrogen` or migration to the full Hydrogen framework is required.

---

## Ecosystem (High Level)

```mermaid
flowchart LR
  subgraph Store [Shopify Store]
    Theme[Liquid Theme]
    Nav[main-menu]
    Footer[Footer]
    BlogShop[Store Blog]
  end
  subgraph App [Next.js App]
    DojoStorefront[The Dojo - Storefront]
    DojoHub[The Dojo - Member Hub]
    DojoBlog[Dojo Blog]
  end
  subgraph Community [Public Community]
    Discord[Discord Server]
    BlogShop
    DojoBlog
  end
  Theme --> Nav
  Nav -->|"My Dojo"| DojoHub
  Nav -->|"Community" page| Community
  Footer -->|Discord, Store Blog, Dojo Blog| Community
  DojoStorefront --> DojoHub
  DojoStorefront --> DojoBlog
```

---

## Getting Started

### Prerequisites

- **Node.js** (LTS) and **pnpm**
- **Shopify CLI** (for theme development and app extension)
- **Supabase** (account and project for MNKY VERSE blog and backend)

### Setup

1. Clone the repo and install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` at the **monorepo root** and set values. Key vars include:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Shopify Storefront API keys
   - `SUPABASE_SERVICE_ROLE_KEY` for server-side operations
   - Optional: Notion, OpenAI, Vercel, etc., per feature.
   `pnpm dev` and `pnpm build` load `.env.local` and `.env` from the root via dotenv-cli.

3. Run the Next.js app (from repo root):

   ```bash
   pnpm dev
   ```

   App runs at `http://localhost:3000`. Dojo storefront and blog: `/dojo`, `/dojo/blog`, `/dojo/community`; Dojo member hub: `/dojo/me`.

4. **Theme (Shopify):** Use Shopify CLI from the **repo root**. Push/pull the theme from `Shopify/theme/` and preview. See [Shopify/docs/NAVIGATION-MENU-SETUP.md](Shopify/docs/NAVIGATION-MENU-SETUP.md) for nav and footer setup.

5. **App extension:** Develop and deploy via Shopify CLI from the **repo root**; extension lives in `extensions/mood-mnky-theme/`.

Further setup (Supabase migrations, MNKY VERSE blog sync, MNKY LABZ): see [docs/](docs/) and [docs/SUPABASE-VERSE-BLOG-PRODUCTION.md](docs/SUPABASE-VERSE-BLOG-PRODUCTION.md) where applicable.

---

## Key Directories

| Path | Purpose |
|------|---------|
| `apps/web/` | Next.js app (App Router, Main, Dojo, MNKY LABZ, Blending, API routes). Run from root with `pnpm dev` or `pnpm build`. |
| `apps/web/app/`, `apps/web/components/`, `apps/web/lib/` | App pages, shared UI, Shopify/Supabase utilities |
| `packages/` | Shared packages (optional; add when extracting shared code) |
| `Shopify/theme/` | Liquid theme (sections, templates, assets). Use from repo root: `shopify theme push --path Shopify/theme` |
| `extensions/mood-mnky-theme/` | Theme app extension (blocks, embed). Use Shopify CLI from repo root. |
| `supabase/` | Migrations, Edge Functions, config. Use Supabase CLI from repo root. |
| `docs/` | Design system, integration report, runbooks (repo docs) |
| `mnky-docs/` | Mintlify documentation (MOOD MNKY). Run `pnpm docs:dev` from root to preview. In Mintlify dashboard set monorepo path to `/mnky-docs`. |

### Monorepo deployment (Vercel)

- **Root Directory:** Set to `apps/web` in the Vercel project settings.
- **Build Command:** From repo root, e.g. `cd ../.. && pnpm install && pnpm turbo build --filter=web` (or let Vercel detect Turborepo when `turbo.json` exists at root; if Root Directory is `apps/web`, run install and build from repo root in the build command).
- **Environment variables:** Configure in Vercel as before; list any build-affecting vars in root `turbo.json` `globalEnv` so Turbo cache keys are correct.

---

## Process and decision support

Before major phase gates, product-boundary changes, or large PRs, consider running **`/reflect`** or invoking the **sage-mnky** agent for trade-offs, architecture implications, and reflection. See [docs/CURSOR-AGENTS.md](docs/CURSOR-AGENTS.md) and [.cursor/commands/reflect.md](.cursor/commands/reflect.md). This is advisory only; it does not block commits.

---

## Roadmap

- **Phase 1 — Store–Dojo alignment:** Theme copy, nav, and CTAs aligned with the Dojo; app base URL and featured blog link to Dojo blog. (Done.)
- **Phase 2 — Dojo and Community clarity:** Dojo framed as storefront + member hub (in-app); Community as Discord + store blog + Dojo blog; theme slideshow and multicolumn updated; footer Community block and nav/docs updated. (Done.)
- **Phase 3 — Dojo blog and theme:** Optional public read-only API for Dojo blog so theme or app blocks can show “Latest from the Dojo”; cross-linking and optional cross-posting between store blog and Dojo blog.
- **Phase 4 — MNKY LABZ enhancements:** Dashboard and backstage tools; Notion/sync and operational workflows as needed.
- **Phase 5 — Ongoing:** Performance, accessibility, and conversion flows per [Shopify/theme-ui-ux-baseline-links.md](Shopify/theme-ui-ux-baseline-links.md) and design system.

### Companion & Manga Engine

The **MNKY VERSE Companion** and **Collection Manga** engine extend the Dojo, gamification, and storefront with narrative issues, Flowise tools, and Shopify metaobjects. Phases:

- **Phase 1:** Env and docs — Flowise vars in `.env.example`, [docs/COMPANION-MANGA-ROADMAP.md](docs/COMPANION-MANGA-ROADMAP.md).
- **Phase 2:** Shopify metaobject schema for manga (`mnky_collection`, `mnky_issue`) and publish pipeline: `POST /api/shopify/sync/metaobject-manga`. See [docs/SHOPIFY-MANGA-METAOBJECTS.md](docs/SHOPIFY-MANGA-METAOBJECTS.md).
- **Phase 3:** Flowise tools (hotspot mapper, quiz generator) at `app/api/flowise/tools/manga/`; Riftbound narrative and copy guidance in [docs/RIFTBOUND-NARRATIVE-GUIDANCE.md](docs/RIFTBOUND-NARRATIVE-GUIDANCE.md).
- **Phase 4:** Dojo UX — manga/quests/XP, reader/hotspots; optional theme block for “Current issue” (see [docs/DOJO-SECTION.md](docs/DOJO-SECTION.md)).
- **Phase 5:** Flowise execute usage, rate limiting, Realtime; optional AI SDK/agents; future Discord/rewards.

**References:** [temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md](temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md), [docs/PRD-Collection-Manga-Magazine.md](docs/PRD-Collection-Manga-Magazine.md), [docs/PRD-Gamification-MNKY-VERSE.md](docs/PRD-Gamification-MNKY-VERSE.md), [docs/MAG-XP-RULES.md](docs/MAG-XP-RULES.md), [docs/FLOWISE-FRAGRANCE-CRAFTING.md](docs/FLOWISE-FRAGRANCE-CRAFTING.md), [docs/SHOPIFY-INTEGRATION-ROADMAP.md](docs/SHOPIFY-INTEGRATION-ROADMAP.md), [docs/VERSE-STOREFRONT-STACK.md](docs/VERSE-STOREFRONT-STACK.md). For Companion/Manga work use **Cursor subagents** (shopify, verse-storefront, labz, verifier, debugger) and the **design** skill for UI; optional Context7 and Shopify Dev MCP for docs/API.

---

## Contributing and Docs

- **Design system:** [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md)
- **Shopify nav and footer:** [Shopify/docs/NAVIGATION-MENU-SETUP.md](Shopify/docs/NAVIGATION-MENU-SETUP.md)
- **Dojo storefront stack:** [docs/VERSE-STOREFRONT-STACK.md](docs/VERSE-STOREFRONT-STACK.md) — Next.js + Hydrogen React (Storefront API); not a Remix Hydrogen app.
- **Store–Verse integration:** [docs/SHOPIFY-MNKY-VERSE-INTEGRATION-REPORT.md](docs/SHOPIFY-MNKY-VERSE-INTEGRATION-REPORT.md)
- **Cursor subagents:** [docs/CURSOR-AGENTS.md](docs/CURSOR-AGENTS.md) — project subagents (shopify, verse-storefront, labz, verifier, debugger) and how to invoke them.
- **Cursor rules and commands:** [docs/CURSOR-RULES-AND-COMMANDS.md](docs/CURSOR-RULES-AND-COMMANDS.md) — rules in `.cursor/rules`, commands in `.cursor/commands`, and how they work with skills and agents.
- **Companion & Manga:** [docs/COMPANION-MANGA-ROADMAP.md](docs/COMPANION-MANGA-ROADMAP.md) — full roadmap, PRDs, Flowise tools, metaobjects, Riftbound guidance.

See `docs/` for more runbooks and references.

---

## License and Brand

MOOD MNKY — bespoke fragrance and the Dojo. For more on the brand and ecosystem, see [docs.moodmnky.com](https://docs.moodmnky.com) (when available).
