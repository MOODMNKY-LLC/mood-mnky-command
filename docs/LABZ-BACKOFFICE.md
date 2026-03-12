# LABZ Backoffice

MNKY LABZ is the app and ecosystem backoffice for MOOD MNKY. This document maps contexts, sidebar groups, credentials, and where to configure things.

## Context switcher (team switcher)

The sidebar shows one **context** at a time. Switch via the dropdown at the top of the sidebar.

| Context    | Plan                    | Main content |
|-----------|-------------------------|--------------|
| **Lab**   | Product data & builder  | Dashboard, Formulas, Fragrance Oils, Glossary, Blending Lab, Wicks & Wax, Product Builder, Integrations (Notion, Flowise, Discord) |
| **Store** | Shopify admin          | Store Overview, Catalog (Products, Collections, Inventory), Sales (Orders, Customers, Discounts), Growth (Marketing, Analytics), Content, MNKY LABZ Pages, Finance |
| **Verse** | Storefront & community | MNKY VERSE, Products, Collections, Cart, Discord; Community: Manga/Issues, Manga Collections, XP & Quests, UGC Moderation, Discord Events |
| **Platform** | Data & automation  | Data & Admin (Overview, Table Editor, SQL Editor, Storage, Members); Automation & Workflows (Funnels, Flowise, Storefront Assistant, Service Analytics, Infra Artifacts); Settings & Integrations (Settings, Integrations) |
| **AI Tools** | Chat & studio      | Create & Chat (CODE MNKY, AI Chat, Agents, Eleven Labs, Image/Audio/Video Studio, Media Library) |

## Sidebar behavior

- **Filter:** When the Lab context is active, a filter input at the top of the sidebar filters Product Data, Product Builder, and Integrations by label.
- **Badges:** Dashboard (Lab) can show a formula count badge when stats are loaded.
- **Collapsibles:** Store, Verse, and Platform groups open by default when the current path is under that section (e.g. Platform Data opens when on `/platform/tables`).
- **Footer:** Docs (link to `/docs`), Home (link to `/main`), Sign out.

## Settings and configuration

- **Platform → Settings** (`/platform/settings`): Read-only credentials status for Notion, Shopify, and all deployed services (MNKY CLOUD, MEDIA, DRIVE, AUTO, AGENTS, GAMES). Link to Infra artifacts and dashboard config (code reference: `lib/dashboard-config.ts`).
- **Platform → n8n** (`/platform/n8n`): n8n (MNKY AUTO) command panel. Workflow list with activate/deactivate, view, delete; recent executions; link to Infra Artifacts. Configure via N8N_API_URL/N8N_API_KEY or mnky-auto in Settings.
- **Platform → Integrations** (`/platform/integrations`): Same credentials status at a glance with direct links to Notion Sync, Store, Discord, Flowise, Service Analytics.
- **Platform → Infra Artifacts** (`/platform/artifacts`): Current theme and Dockerfile URLs per service (from `infra_artifact_versions`). Publish with `pnpm run publish:infra` from repo root.

Credentials are **not** stored in LABZ; they live in `.env` / `.env.local`. See:

- **Deployed services (Nextcloud, Jellyfin, n8n, Flowise, etc.):** [docs/SERVICES-ENV.md](SERVICES-ENV.md)
- **Dashboard and Notion/Shopify:** [docs/DASHBOARD-ENV.md](DASHBOARD-ENV.md)
- **Infra artifacts (themes, Docker, n8n):** [docs/INFRA-STORAGE.md](INFRA-STORAGE.md)

## Admin docs (in-app)

Under **LABZ → Docs** (or `/docs`), the **Admin** section lists all markdown files in `docs/admin/`. Use it for technical references (Supabase, CDN, n8n, sync, etc.). A “LABZ overview” or “Backoffice map” entry mirrors this document so in-app and repo docs stay aligned.

## Ecosystem links

From the context switcher dropdown, **Ecosystem** links: Home (MOOD MNKY), Documentation, MNKY VERSE. These are cross-context shortcuts.
