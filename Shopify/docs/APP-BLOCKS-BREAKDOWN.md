# MOOD MNKY Theme — App Blocks & Embeds (Verified)

This document is the **source of truth** for what appears in the Shopify theme editor under the MOOD MNKY app. It was verified against the theme app extension schema (`extensions/mood-mnky-theme/blocks/*.liquid`).

---

## Where things appear in the theme editor

| Where | What you see |
|-------|------------------|
| **Add block** → **Apps** → **MOOD MNKY Theme** | Four **app blocks** (below). |
| **Theme settings** (gear) → **App embeds** → **MOOD MNKY Theme** | One **app embed**: **MNKY Assistant**. |

**MNKY Assistant** does **not** appear in the “Add block” list because it has `"target": "body"` (app embed). It is configured only under **App embeds**.

---

## Verified mapping

| Filename | Display name in theme editor | Type | Purpose |
|----------|-----------------------------|------|---------|
| `blending-cta.liquid` | **Blending Lab CTA** | App block | CTA linking to app Blending Lab (`/blending`) |
| `verse-blog.liquid` | **Latest from MNKY VERSE** | App block | Fetches recent posts from app API (`/api/verse/blog`) and “View all” link to `/verse/blog` |
| `fragrance-finder-cta.liquid` | **Match My Mood CTA** | App block | CTA linking to fragrance finder / Match My Mood (`/craft`) |
| `subscription-cta.liquid` | **Subscription CTA** | App block | CTA linking to subscription/discovery in app (default path `/blending`) |
| `mnky-assistant-embed.liquid` | **MNKY Assistant** | App embed | Floating chat button; configured under **Theme settings → App embeds** only |

---

## Summary

- **Under Apps (Add block):** Blending Lab CTA, Latest from MNKY VERSE, Match My Mood CTA, Subscription CTA.
- **Under App embeds:** MNKY Assistant only.

All blocks/embeds use the **App base URL** setting (e.g. `https://mnky-command.moodmnky.com`). See `docs/SHOPIFY-APP-URL-CONFIG.md` for canonical URL and setup.

---

## Homepage placement (reconciled)

Production and development themes are reconciled with the repo. On the **homepage** (`templates/index.json`):

- The **four app blocks** live in a single **Apps** section (section id `1771436989adce6292`), placed **after** the Newsletter section.
- Each block has **App base URL** set to `https://mnky-command.moodmnky.com` in the repo.
- Order within the section: Blending Lab CTA → Latest from MNKY VERSE → Match My Mood CTA → Subscription CTA.

**To add or re-add blocks in the theme editor:** Theme Customize → Homepage → scroll to the **Apps** section (at the bottom) → **Add block** → **Apps** → **MOOD MNKY Theme** → choose the block. Set **App base URL** to `https://mnky-command.moodmnky.com` (or `http://localhost:3000` for dev). After saving, run `shopify theme pull --path Shopify/theme --live` (or `--development`) to persist block IDs/settings into the repo.
