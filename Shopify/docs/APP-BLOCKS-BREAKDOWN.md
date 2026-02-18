# MOOD MNKY Theme — App Blocks & Embeds (Verified)

This document is the **source of truth** for what appears in the Shopify theme editor under the MOOD MNKY app. It was verified against the theme app extension schema (`extensions/mood-mnky-theme/blocks/*.liquid`).

---

## Where things appear in the theme editor

| Where | What you see |
|-------|------------------|
| **Add block** → **Apps** → **MOOD MNKY Theme** | Four **app blocks** (below). |
| **Theme settings** (gear) → **App embeds** → **MOOD MNKY Theme** | One **app embed**: **MNKY CHAT**. |

**MNKY CHAT** does **not** appear in the “Add block” list because it has `"target": "body"` (app embed). It is configured only under **App embeds**.

---

## Verified mapping

| Filename | Display name in theme editor | Type | Purpose |
|----------|-----------------------------|------|---------|
| `blending-cta.liquid` | **Blending Lab CTA** | App block | CTA linking to app Blending Lab (`/blending`) |
| `verse-blog.liquid` | **Latest from MNKY VERSE** | App block | Fetches recent posts from app API (`/api/verse/blog`) and “View all” link to `/verse/blog` |
| `fragrance-finder-cta.liquid` | **Match My Mood CTA** | App block | CTA linking to fragrance finder / Match My Mood (`/craft`) |
| `subscription-cta.liquid` | **Subscription CTA** | App block | CTA linking to subscription/discovery in app (default path `/blending`) |
| `mnky-assistant-embed.liquid` | **MNKY CHAT** | App embed | Floating chat button; configured under **Theme settings → App embeds** only |

---

## Summary

- **Under Apps (Add block):** Blending Lab CTA, Latest from MNKY VERSE, Match My Mood CTA, Subscription CTA.
- **Under App embeds:** MNKY CHAT only.

All blocks/embeds use the **App base URL** setting (e.g. `https://mnky-command.moodmnky.com`). See `docs/SHOPIFY-APP-URL-CONFIG.md` for canonical URL and setup.

---

## Homepage placement (reconciled)

Production and development themes are reconciled with the repo. On the **homepage** (`templates/index.json`):

- The **four app blocks** live in a single **Apps** section (section id `1771436989adce6292`), placed **after** the Newsletter section.
- Each block has **App base URL** set to `https://mnky-command.moodmnky.com` in the repo.
- Order within the section: Blending Lab CTA → Latest from MNKY VERSE → Match My Mood CTA → Subscription CTA.

**To add or re-add blocks in the theme editor:** Theme Customize → Homepage → scroll to the **Apps** section (at the bottom) → **Add block** → **Apps** → **MOOD MNKY Theme** → choose the block. Set **App base URL** to `https://mnky-command.moodmnky.com` (or `http://localhost:3000` for dev). After saving, run the pull command below to persist block IDs/settings into the repo.

---

## Orientation and placement (Option A – two Apps sections)

Blocks are stacked because the Apps section has no grid; they render in one column. To improve flow without editing theme code:

1. **Add a second Apps section** (e.g. after “Sensory Journeys” or “Subscribe to the Vibe”).
   - Add only **Blending Lab CTA** and **Match My Mood CTA**. Set **App base URL** to `https://mnky-command.moodmnky.com` per [SHOPIFY-APP-URL-CONFIG.md](SHOPIFY-APP-URL-CONFIG.md).
   - Optionally remove those two blocks from the existing Apps section at the bottom (or leave and remove duplicates after pull).
2. **Add a third Apps section** (or reuse the second) after “Stories from the MNKY VERSE”, before **Newsletter**.
   - Add only **Latest from MNKY VERSE** and **Subscription CTA**.
3. **Save** the theme in the editor.
4. **Pull** the theme into the repo:
   ```bash
   shopify theme pull --path Shopify/theme --store <your-store> --live
   ```
   Use `--development` if you edited the development theme.
5. Review the updated `templates/index.json`: section order, block distribution, and remove any duplicate blocks if needed.

**Suggested placement by block:**

| Block | Suggested placement | Rationale |
|-------|---------------------|-----------|
| **Blending Lab CTA** | After “Subscribe to the Vibe” or in a first “Experience” Apps section after Sensory Journeys | Fits after products and subscription collection. |
| **Match My Mood CTA** | Right after “Why MOOD MNKY” or right after “Sensory Journeys” | Discovery moment works best early. |
| **Latest from MNKY VERSE** | Immediately before or after **Stories from the MNKY VERSE** (featured-blog) | Pairs with existing blog section. |
| **Subscription CTA** | Just before **Newsletter** or right after “Subscribe to the Vibe” | Converts subscribe intent before newsletter signup. |

**Layout (Option B):** The Apps section supports a **Layout** setting in the theme editor: **Stacked** (default), **2 columns**, or **4 columns**. Use it for side‑by‑side blocks on desktop; mobile stays stacked.
