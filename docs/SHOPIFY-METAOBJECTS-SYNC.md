# Shopify metaobjects sync (Phase 2 — native Liquid Glossary)

This doc describes the one-way sync from Supabase **fragrance_notes** to Shopify **metaobjects** (type `fragrance_note`), and how to use native Liquid templates for the Glossary on the store.

## Overview

- **Goal:** Native Shopify URLs and Liquid-rendered content for the fragrance note Glossary (SEO, theme flexibility).
- **Flow:** Supabase `fragrance_notes` → sync API → Shopify metaobject entries (type `fragrance_note`). Theme templates render them with Liquid.
- **Optional:** The iframe Glossary page (`page.glossary` → `/verse/glossary`) remains available; you can point the menu to the native index or keep the iframe.

## Metaobject definition

- **Type:** `fragrance_note` (merchant-owned).
- **Storefront access:** `PUBLIC_READ` so Liquid and Storefront API can read.
- **Fields:** `name`, `slug`, `description_short`, `olfactive_profile`, `facts` (all text).
- **Creation:** The sync API ensures the definition exists (idempotent) before syncing. Requires Shopify Admin API scopes: `write_metaobject_definitions`, `write_metaobjects`, `read_metaobjects`.

## Sync API

**Endpoint:** `POST /api/shopify/sync/metaobject-fragrance-notes`

- Reads all rows from `fragrance_notes` (Supabase).
- Ensures the `fragrance_note` metaobject definition exists in Shopify.
- For each note: **create** (if new) or **update** (if `shopify_metaobject_id` set or handle already exists) the metaobject entry.
- Writes back `shopify_metaobject_id` and `shopify_synced_at` on `fragrance_notes`.

**Prerequisites:**

1. Shopify env: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_API_TOKEN` (with metaobject scopes).
2. Supabase migration applied: `20260220100000_fragrance_notes_shopify_metaobject.sql` (adds `shopify_metaobject_id`, `shopify_synced_at`).

**When to run:** After adding or editing fragrance notes in MNKY LABZ, or on a schedule (e.g. cron or manual trigger from dashboard).

## Theme templates

| File | Purpose |
|------|--------|
| `templates/metaobject/fragrance_note.json` | Single fragrance note (native URL: `/metaobject/fragrance_note/{handle}`). Uses section `metaobject-fragrance-note`. |
| `templates/page.glossary-native.json` | Glossary index page. Uses section `glossary-index` to list all `fragrance_note` metaobjects with links to their native URLs. |

**Sections:**

- `sections/metaobject-fragrance-note.liquid` — Renders one metaobject: name, description, olfactive profile, facts.
- `sections/glossary-index.liquid` — Loops `metaobjects.fragrance_note.values` and links to each entry’s `system.url`.

## Using the native Glossary on the store

1. **Sync data:** Call `POST /api/shopify/sync/metaobject-fragrance-notes` (e.g. from MNKY LABZ or a script).
2. **Push theme:** Ensure `metaobject.fragrance_note.json`, `page.glossary-native.json`, and the two sections are in the theme (`shopify theme push --path Shopify/theme` or upload from MNKY LABZ Pages).
3. **Create a page (optional):** In Shopify Admin or MNKY LABZ Pages, create a page with handle e.g. `glossary-native` and template **Glossary (native)** (`page.glossary-native`). This page will show the list of fragrance notes with links to `/metaobject/fragrance_note/{handle}`.
4. **Menu:** You can point the MOOD LABZ dropdown item “Glossary” to this native page instead of the iframe page, or keep both (e.g. “Glossary (native)” vs “Glossary (app)”).

## Related

- [SHOPIFY-LABZ-PAGES-AND-MENU.md](./SHOPIFY-LABZ-PAGES-AND-MENU.md) — MOOD LABZ pages and iframe templates.
- [STOREFRONT-READ-ONLY-APIS.md](./STOREFRONT-READ-ONLY-APIS.md) — Public APIs for glossary/formulas/oils.
- Plan: Phase 2 in MOOD LABZ Shopify Store Pages implementation plan.
