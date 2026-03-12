# Shopify Manga Metaobjects (MNKY VERSE)

This doc describes the **metaobject schema** for manga collections and issues in Shopify, and the **publish pipeline** from Supabase to Shopify. It enables the theme and Storefront API to expose "current issue" or collection data without calling the app for every request.

See [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md) and [temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md](../temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md) for context. Pattern follows [SHOPIFY-METAOBJECTS-SYNC.md](SHOPIFY-METAOBJECTS-SYNC.md) (fragrance_notes).

---

## Overview

- **Goal:** One-way sync from Supabase manga tables to Shopify metaobjects so Liquid and Storefront API can read collection/issue (and optionally chapter/panel/hotspot) data.
- **Flow:** Verse Backoffice triggers "Publish to Shopify" → `POST /api/shopify/sync/metaobject-manga` (or per-issue) → reads Supabase, ensures metaobject definitions exist, creates/updates metaobject entries. Optionally writes back `shopify_metaobject_id` and `shopify_synced_at` on `mnky_collections` and `mnky_issues`.
- **Scopes:** Shopify Admin API `write_metaobject_definitions`, `write_metaobjects`, `read_metaobjects`. Storefront access: `PUBLIC_READ` for types that the theme/Storefront should read.

---

## Metaobject types (schema)

Create these in **Shopify Admin → Settings → Custom data** (or via Admin API). Handles are used as stable identifiers (e.g. collection slug, issue slug).

### 1. `mnky_collection`

| Key | Type | Description |
|-----|------|--------------|
| `name` | single_line_text_field | Display name (e.g. "RIFTBOUND — The Sensory Atlas") |
| `slug` | single_line_text_field | Unique handle (e.g. "riftbound") |
| `shopify_collection_gid` | single_line_text_field | Shopify collection GID for cross-sell |

- **Storefront:** PUBLIC_READ.

### 2. `mnky_issue`

| Key | Type | Description |
|-----|------|--------------|
| `collection` | metaobject_reference (mnky_collection) | Parent collection |
| `issue_number` | number_integer | Issue number |
| `title` | single_line_text_field | Issue title |
| `slug` | single_line_text_field | Unique handle (e.g. "riftbound-vol-i") |
| `arc_summary` | multi_line_text_field | Story arc summary |
| `cover_asset_url` | url | Cover image URL |
| `status` | single_line_text_field | "draft" or "published" |
| `published_at` | date_time | Publish timestamp (optional) |

- **Storefront:** PUBLIC_READ.

### 3. `mnky_chapter` (optional for Phase 2b)

| Key | Type | Description |
|-----|------|--------------|
| `issue` | metaobject_reference (mnky_issue) | Parent issue |
| `chapter_order` | number_integer | Order in TOC |
| `rift_name` / `fragrance_name` | single_line_text_field | Chapter/fragrance name |
| `shopify_product_gid` | single_line_text_field | Product GID |
| `setting` | single_line_text_field | In-world setting |

### 4. `mnky_panel` (optional for Phase 2b)

| Key | Type | Description |
|-----|------|--------------|
| `chapter` | metaobject_reference (mnky_chapter) | Parent chapter |
| `panel_number` | number_integer | Panel order |
| `script_text` | multi_line_text_field | Narrative text |
| `asset_prompt` | multi_line_text_field | Art prompt |
| `asset_url` | url | Panel image URL |

### 5. `mnky_hotspot` (optional for Phase 2b)

| Key | Type | Description |
|-----|------|--------------|
| `panel` | metaobject_reference (mnky_panel) | Parent panel |
| `type` | single_line_text_field | product | variant | collection | bundle |
| `shopify_gid` | single_line_text_field | Target GID |
| `x` | number_decimal | 0–1 |
| `y` | number_decimal | 0–1 |
| `label` | single_line_text_field | Label |
| `tooltip` | single_line_text_field | Tooltip |

---

## Publish pipeline (implementation)

**Endpoint:** `POST /api/shopify/sync/metaobject-manga`

- **Query/body:** Optional `issueId` or `issueSlug` to publish a single issue; otherwise publishes all published issues (and their collections).
- **Steps:**
  1. Ensure metaobject definitions exist for `mnky_collection` and `mnky_issue` (and optionally chapter/panel/hotspot).
  2. For each collection referenced by an issue to publish: create or update `mnky_collection` metaobject by slug; optionally store `shopify_metaobject_id` / `shopify_synced_at` on `mnky_collections`.
  3. For each issue: create or update `mnky_issue` metaobject (reference collection by handle/GID); optionally store `shopify_metaobject_id` / `shopify_synced_at` on `mnky_issues`.
  4. (Phase 2b) For each chapter/panel/hotspot, create/update metaobjects in dependency order.
- **Auth:** Admin session or `MOODMNKY_API_KEY` (Bearer). See route implementation.

**Migration:** `20260303100000_manga_shopify_metaobject_columns.sql` adds `shopify_metaobject_id` (text) and `shopify_synced_at` (timestamptz) to `mnky_collections` and `mnky_issues` for idempotent updates.

---

## Metaobject definition (Admin API)

The app creates `mnky_issue` with a `metaobject_reference` field for `collection` via `reference: { type: "mnky_collection" }` in `MetaobjectFieldDefinitionCreateInput`. If definition create fails with a reference-related error, check the [Shopify Admin API MetaobjectFieldDefinitionCreateInput](https://shopify.dev/docs/api/admin-graphql/latest/input-objects/MetaobjectFieldDefinitionCreateInput) and [MetaobjectDefinitionCreateInput](https://shopify.dev/docs/api/admin-graphql/latest/input-objects/MetaobjectDefinitionCreateInput) docs for the current schema (e.g. `reference` vs `references`).

---

## Theme / Storefront usage

- **Liquid:** Query metaobjects by type (e.g. `metaobjects.mnky_issue.values`) and filter by `status = "published"` to show "Current issue" or a list. Use `system.url` for native metaobject URLs.
- **Storefront API:** If metaobject definitions are set to Storefront access, you can query them via the Storefront API (metaobjects query).
- **Verse reader:** Remains Supabase-backed for real-time read/telemetry; metaobjects are a cache for theme and discovery.

### App Proxy vs metaobjects for “current issue”

**Recommendation:** Prefer **Shopify metaobjects** for theme “current issue” when possible: they are read directly by Liquid and Storefront API without an extra HTTP call, and they stay in sync after “Publish to Shopify.” Use **App Proxy** `GET /apps/mnky/api/issues` when you need live Supabase data (e.g. draft preview, or app-specific filtering) or when metaobject definitions are not yet published. See [Storefront API metaobjects](https://shopify.dev/docs/api/storefront/latest/queries/metaobjects) for querying metaobjects in Storefront.

---

## Related

- [MNKY-VERSE-APP-PROXY-SETUP.md](MNKY-VERSE-APP-PROXY-SETUP.md) — App Proxy, session, api/issues.
- [PRD-Collection-Manga-Magazine.md](PRD-Collection-Manga-Magazine.md) — Canonical data model and telemetry.
