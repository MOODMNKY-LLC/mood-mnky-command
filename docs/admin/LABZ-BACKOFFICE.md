---
title: MNKY LABZ Backoffice
description: Map of MNKY LABZ contexts, sidebar groups, Settings, and credentials documentation.
---

# MNKY LABZ Backoffice

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

## Settings and configuration

- **Platform → Settings** (`/platform/settings`): Credentials status (Notion, Shopify, deployed services), Infra artifacts link, Dashboard config reference.
- **Platform → Integrations** (`/platform/integrations`): Connected services status and links.
- **Platform → Infra Artifacts** (`/platform/artifacts`): Theme and Dockerfile URLs; publish with `pnpm run publish:infra`.

Credentials live in `.env` / `.env.local`. See SERVICES-ENV.md, DASHBOARD-ENV.md, INFRA-STORAGE.md in this admin section.
