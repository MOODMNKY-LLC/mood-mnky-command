# MNKY BOX Editorial — Refined Plan

This document refines the CHATGPT MNKY BOX editorial plan and ties it to the existing manga and gamification systems. See also [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) (MNKY BOX subsection), [PRD-Collection-Manga-Magazine.md](PRD-Collection-Manga-Magazine.md), and [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md).

## 1. Data model and single source of truth

- **No separate “drops” table.** One **issue** drives both the manga reader and the MNKY BOX view. Product list = **chapters** of that issue (`fragrance_name`, `shopify_product_gid`, `setting`, optional first-panel image).
- **Optional box-only fields on `mnky_issues`** (migration `20260323000000_mnky_issues_box_editorial_columns.sql`):
  - `accent_primary`, `accent_secondary` (hex) — seasonal accent; default in app: `#B7F0FF`, `#F6D1A7`.
  - `hero_asset_url` — hero image for box view; falls back to `cover_asset_url` if null.
  - `lore_override` — lore copy for box; falls back to `arc_summary` if null.
- **Storage:** Reuse **manga-assets** for box hero (e.g. `box-hero/{issue_id}.{ext}`) or use `cover_asset_url`; document in [MANGA-STORAGE-AND-IMAGES.md](MANGA-STORAGE-AND-IMAGES.md) if you add a dedicated path.

## 2. API and Verse route

- **API:** `GET /api/mag/issues/[slug]/box` — returns issue (with box fields), collection, and `products` (chapters with `card_image_url` from first panel when available). Only published issues.
- **Verse route:** `/verse/drops/[slug]` — server component loads issue + chapters + first-panel assets from Supabase and renders BoxFrame → BoxHero → BoxGrid (BoxCard per chapter) → BoxCTA. Link from issue detail: “View as MNKY BOX”.

## 3. Design tokens

- **Scoped:** `.mnky-box` in `app/(storefront)/verse/mnky-box.css` with variables `--mnky-box-*`. Tailwind theme extended with `mnkyBox` colors, `boxShadow.mnky-float`, `maxWidth.mnky-container` so classes do not clash with root.
- **Per-drop override:** The drops page sets `--mnky-box-accent-primary` and `--mnky-box-accent-secondary` from the issue row when present.

## 4. Shopify theme section

- **Path:** `Shopify/theme/sections/mnky-box.liquid`.
- **Behavior:** Section settings (kicker, title, subhead, hero image, colors, CTA URL/label) and blocks of type “product” (image, title, body, meta, link, link label). Pure Liquid/CSS; no React. Optionally later: feed from metaobjects (`mnky_issue` / `mnky_chapter`) when Storefront API metaobject query is used in theme.

## 5. Gamification (XP and drop quests)

- **Use existing schema.** Do **not** add `mnky_xp_events` or `mnky_xp_balances`. Use:
  - **xp_ledger** — append-only; `source` e.g. `'mnky_verse'`, `'discord'`, `'shopify'`; `reason` e.g. `'mnky_box_drop_quest'`.
  - **xp_state** — materialized total and level per profile.
  - **quests** — with `season_id` → **mnky_seasons**; rule jsonb can reference `issue_slug` or issue_id for drop-specific quests.
  - **rewards**, **reward_claims**, **quest_progress**, **discord_event_ledger** as already defined.
- **Drop quest:** Create quests that reward reading the box lore, completing the issue quiz, or sharing in Discord; award XP into `xp_ledger` via existing or new API (e.g. `/api/xp/award`). Rate limits and one-time rewards implemented in that API. See [supabase/migrations/20260220140000_gamification_ugc_tables.sql](supabase/migrations/20260220140000_gamification_ugc_tables.sql) and [20260220150000_xp_functions.sql](supabase/migrations/20260220150000_xp_functions.sql).

## 6. MNKY BOX + free-tier subscription

The box CTA (“Unlock Members Access” → **/verse/join**) can be used to begin a **free-tier subscription** to the brand: e.g. sign up (Verse account) to access drops, manga, and community. No schema change required; the existing Verse auth and Dojo/members area form the basis. Optional next steps: explicit “Free tier” vs “Members” in nav or profile, and gating selected content or perks by tier (e.g. quests, Discord roles) using existing `rewards` and level.

## 7. Discord and free-tier

- **Discord:** Drop announcements (webhooks), drop quests (Discord events → `discord_event_ledger` → quest evaluate → XP), and app-wide integration are documented in [DISCORD-INTEGRATION-PLAN.md](DISCORD-INTEGRATION-PLAN.md). Use the Discord MCP (`discord_get_server_info` with guild ID from MNKY LABZ or `DISCORD_GUILD_ID_MNKY_VERSE`) to inspect the MOOD MNKY server.
- **Free-tier:** Box CTA “Unlock Members Access” → `/verse/join`; free sign-up and Discord link support drop quests and community without a paid tier. See §6 and [FREE-TIER-SUBSCRIPTION.md](FREE-TIER-SUBSCRIPTION.md).

## 8. References

- Free-tier subscription: [FREE-TIER-SUBSCRIPTION.md](FREE-TIER-SUBSCRIPTION.md)
- Manga storage and images: [MANGA-STORAGE-AND-IMAGES.md](MANGA-STORAGE-AND-IMAGES.md)
- Manga PRD: [PRD-Collection-Manga-Magazine.md](PRD-Collection-Manga-Magazine.md)
- Shopify manga metaobjects: [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md)
- Design system: [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md)
- Gamification migrations: `supabase/migrations/20260220140000_gamification_ugc_tables.sql`, `20260220150000_xp_functions.sql`
