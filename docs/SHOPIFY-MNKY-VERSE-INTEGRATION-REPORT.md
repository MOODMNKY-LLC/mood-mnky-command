# Shopify MNKY VERSE Brand Integration — Final Report

This report documents the first comprehensive pass to align the Shopify theme and admin with the MNKY VERSE and MNKY LABZ brand ecosystem. It serves as the single reference for copy, admin steps, and technical decisions.

---

## 1. Knowledge Development — How Everything Fits Together

### Theme (Liquid)

- **Location:** `Shopify/theme/` (Dawn-derived).
- **Header:** Uses **main-menu** (Shopify Admin → Online Store → Navigation). Announcement bar and header group live in `sections/header-group.json`; the theme editor or `config/settings_data.json` can override section defaults.
- **Footer:** Configured in `sections/footer-group.json` (footer block: text block for brand tagline, link_list for “MNKY VERSE” menu). Newsletter heading: “Subscribe to the Vibe — Join the MNKY VERSE.”
- **Homepage:** `templates/index.json` defines sections: slideshow, featured collections, multicolumn (“Why MOOD MNKY”), app-cta (Blending Lab), featured-blog (“Stories from the MNKY VERSE”), newsletter.
- **App CTA / blocks:** The **app-cta** section and theme app extension blocks (`extensions/mood-mnky-theme/blocks/`) point to the app. They use an **App base URL** setting (e.g. `https://app.moodmnky.com`); when set, CTAs link to Blending Lab, Match My Mood, subscriptions, etc.

### Verse Storefront (Next.js)

- **Location:** `app/(storefront)/verse/`, `components/verse/`.
- **Catalog:** Same Shopify catalog via Storefront API (`lib/shopify/storefront-queries.ts`, `storefront-client.ts`).
- **Routes:** `/verse`, `/verse/explore`, `/verse/blog`, `/verse/agents`, `/verse/products`, `/verse/collections`, `/verse/dojo`, `/verse/community`, `/verse/cart`, etc.
- **Blog:** Verse blog is in **Supabase** (`verse_blog_posts`), synced from Notion — served at `https://app.moodmnky.com/verse/blog`. The Shopify theme’s featured-blog uses the **native Shopify blog** (`hello-welcome-to-mood-mnky`). The two are linked by copy and CTAs, not by dynamic content pull.

### Brand Pillars

- **The Experience** — custom/bespoke; **The Dojo** — your private portal in the MNKY VERSE (preferences, default agent; enter via the app); **Community** — public touchpoints (Discord, store blog, Verse blog); **The Foundation** — Blending Lab; “Always scentsing the MOOD”; **MNKY VERSE** (universe); **MNKY LABZ** (admin/backstage).

---

## 2. Copy and Content Checklist

| Area | Location | Before / After or Suggested Copy |
|------|----------|----------------------------------|
| **Homepage – Featured collections** | `index.json` | “Sensory Journeys” and “Subscribe to the Vibe!” descriptions include “in the MNKY VERSE.” |
| **Homepage – Multicolumn** | `index.json` | “Why MOOD MNKY” columns reference “Verse,” “Always scentsing the MOOD,” “in the MNKY VERSE.” |
| **Homepage – App CTA** | `index.json` | “The Foundation — Create your custom fragrance blend,” “Go to Blending Lab.” `app_base_url` set to `https://app.moodmnky.com`. |
| **Homepage – Featured blog** | `index.json` | Heading: “Stories from the MNKY VERSE.” Verse blog link: “View all in the MNKY VERSE” → `https://app.moodmnky.com/verse/blog`. |
| **Homepage – Newsletter** | `index.json` | “Subscribe to the Vibe — Join the MNKY VERSE.” |
| **Header – Announcement** | `header-group.json` | “Welcome to the MNKY VERSE — bespoke fragrance, sensory journeys, extreme personalization. Always scentsing the MOOD.” (Set in Customize → Header group → Announcement bar if overridden by `settings_data.json`.) |
| **Footer** | `footer-group.json` | Text block: “MOOD MNKY” / “Bespoke fragrance in the MNKY VERSE. Always scentsing the MOOD.” Link list: heading “MNKY VERSE,” menu “footer.” Community text block: “Community” with Discord, store blog, Verse blog links (replace Discord link in Customize when invite URL available). Newsletter heading: “Subscribe to the Vibe — Join the MNKY VERSE.” |
| **Blog template** | `blog.json` | Newsletter: “Subscribe to the Vibe — Join the MNKY VERSE”; paragraph references “stories from the MNKY VERSE.” Rich-text CTA: “More from the MNKY VERSE” with link “read more in the MNKY VERSE” → `https://app.moodmnky.com/verse/blog`. |
| **Featured-blog section** | `featured-blog.liquid` + `index.json` | New settings: `verse_blog_url`, `verse_blog_label` (default “View all in the MNKY VERSE”). Homepage has URL and label set. |
| **App extension blocks** | `extensions/mood-mnky-theme/blocks/*.liquid` | Blending CTA, Fragrance Finder, Subscription CTA use `app_base_url` and MNKY VERSE copy in schema defaults; document “Set App base URL to https://app.moodmnky.com” in Theme Editor for each block. |

---

## 3. Admin Step-by-Step Instructions

### 3.1 Navigation — Main Menu

1. **Shopify Admin** → **Online Store** → **Navigation** → **main-menu**.
2. Add or edit items per table below.

| Label | Link / URL |
|-------|------------|
| Home | / |
| Shop | /collections/all or /collections/available-moods |
| Subscriptions | /collections/subscriptions |
| Blending Lab | https://app.moodmnky.com/blending |
| Match My Mood / Craft | https://app.moodmnky.com/craft |
| The Dojo / My Dojo | https://app.moodmnky.com/verse/dojo — *Private portal in the MNKY VERSE app.* |
| Explore | https://app.moodmnky.com/verse/explore |
| Blog | /blogs/hello-welcome-to-mood-mnky |
| Agents | https://app.moodmnky.com/verse/agents |
| Community | Shopify page "Community" (Discord + store blog + Verse blog) or https://app.moodmnky.com/verse/community |

**Mega menu (optional):** In **Customize** → Header group, group items (e.g. **Shop**: Shop, Subscriptions; **The Verse**: Blending Lab, Dojo, Explore, Blog, Agents, Community).

Full reference: [Shopify/docs/NAVIGATION-MENU-SETUP.md](../Shopify/docs/NAVIGATION-MENU-SETUP.md).

### 3.2 Navigation — Footer Menu

1. **Navigation** → create or edit **footer** menu.
2. Add links: About (Who We Are page), MNKY VERSE (https://app.moodmnky.com/verse), **Discord** (invite URL when available), **Store Blog** (/blogs/hello-welcome-to-mood-mnky), **Verse Blog** (https://app.moodmnky.com/verse/blog), Contact, Refund policy, Privacy policy, Terms of service.
3. The theme footer also has a **Community** text block (Discord, store blog, Verse blog); update the Discord link in **Customize** → Footer when you have the invite URL.

### 3.3 Pages to Create (Content → Pages)

| Page title | Summary | CTA |
|------------|---------|-----|
| **Who We Are / About** | Story, “The Experience,” “Always scentsing the MOOD.” | “Enter the MNKY VERSE” → https://app.moodmnky.com/verse |
| **The Dojo** | Your private portal in the MNKY VERSE. Set preferences, default agent, stay connected. Enter via the app. | “Enter the MNKY VERSE” or “Go to My Dojo” → https://app.moodmnky.com/verse/dojo |
| **Community** | Public touchpoints: Discord, store blog, MNKY VERSE blog. List all three with links (Discord invite, /blogs/hello-welcome-to-mood-mnky, https://app.moodmnky.com/verse/blog). | Use as main-menu “Community” target or link from footer. |
| **Blending Lab** | What it is. | “Create your blend” → https://app.moodmnky.com/blending |
| **Fragrance Wheel / Guide** (optional) | Links to app tools. | https://app.moodmnky.com/verse/fragrance-wheel, https://app.moodmnky.com/verse/blending-guide |

Add these to main-menu or footer as appropriate.

### 3.4 Collections and Sales Channel

- **Collections to highlight:** `available-moods`, `subscriptions` (create or curate in Admin if missing).
- **Sales channel:** Ensure the **Headless** (or channel used by the app) sales channel is enabled for all products/collections that should appear in the Verse.
- **Handles:** Keep product/collection handles stable (e.g. `available-moods`, `subscriptions`); Verse uses `handle` for URLs.

### 3.5 Theme Customize

- **Announcement bar:** **Customize** → **Header group** → **Announcement bar** — set copy to the MNKY VERSE line above (if not already in section JSON).
- **Footer:** **Customize** → **Footer** — ensure brand text block and “MNKY VERSE” link list are enabled and use the footer menu.
- **App base URL:** For **app-cta** section and any **app blocks** (Blending CTA, Match My Mood, Subscription CTA), set **App base URL** to `https://app.moodmnky.com` in each block/section settings.
- **Featured blog – Verse link:** In **Customize** → Homepage → **Featured blog** section, **Verse blog URL** is set to `https://app.moodmnky.com/verse/blog` and **Verse blog link label** to “View all in the MNKY VERSE” (already in `index.json`; confirm in editor).

---

## 4. Blog Strategy Summary

- **Shopify blog** (`hello-welcome-to-mood-mnky`): Native store blog; featured-blog section uses it. Use for store news, promos, SEO on the store domain.
- **Verse blog (Supabase/Notion):** Served at `https://app.moodmnky.com/verse/blog`. Use for MNKY VERSE stories and agents.

**Linking store → Verse blog:**

- **Homepage:** Featured-blog section has “View all in the MNKY VERSE” link (section settings `verse_blog_url`, `verse_blog_label`).
- **Blog template:** Rich-text section “More from the MNKY VERSE” with “read more in the MNKY VERSE” link to the app blog.

**No dynamic pull:** Shopify cannot replace the native blog with an external CMS. Cross-link both blogs (recommended); optionally cross-post key Verse posts to the Shopify blog manually.

**Optional:** Theme app extension block “Latest from MNKY VERSE” calling app API (e.g. `GET /api/verse/blog?limit=3`) would require a public read-only app endpoint and CORS/security review.

---

## 5. Technical Notes

- **settings_data.json vs section JSON:** Theme editor and `config/settings_data.json` can override section defaults (e.g. announcement bar, footer). After theme pull or new environment, confirm **Customize** → Header group (announcement) and Footer (blocks, newsletter heading).
- **App base URL:** Centralized in theme as a section/block setting. Production: `https://app.moodmnky.com`. Set in app-cta and each app block (Blending CTA, Fragrance Finder, Subscription CTA).
- **Storefront API / Headless:** Verse uses the same Shopify store via Storefront API; products/collections must be published to the Headless (or relevant) sales channel.
- **Optional:** Public read-only endpoint for Verse blog (e.g. `GET /api/verse/blog?limit=3`) for a “Latest from MNKY VERSE” app block; cache and rate-limit. UTM/referrer for store → app links if tracking outbound traffic.

---

## 6. Risks and Limitations

- **Theme editor overwrites:** Changes in **Customize** can overwrite section JSON. Document desired defaults and re-apply after theme updates if needed.
- **Two blogs:** Shopify blog and Verse blog are separate; no native “dynamic” Shopify blog from Supabase. Cross-linking and optional cross-posting are the levers.
- **settings_data.json:** Store-specific and can differ from repo; new environments or theme copies need announcement and footer (and app base URL) set in Customize or via config.

---

## File and Doc References

| Area | Key paths |
|------|-----------|
| Theme layout/sections | `Shopify/theme/layout/theme.liquid`, `sections/header.liquid`, `sections/footer.liquid` |
| Homepage config | `Shopify/theme/templates/index.json` |
| Header/announcement | `Shopify/theme/sections/header-group.json` |
| Footer | `Shopify/theme/sections/footer-group.json` |
| App CTA | `Shopify/theme/sections/app-cta.liquid` |
| App blocks | `extensions/mood-mnky-theme/blocks/` |
| Verse routes/nav | `components/verse/verse-header.tsx`, `verse-footer.tsx` |
| Verse blog | `app/(storefront)/verse/blog/page.tsx`, `lib/verse-blog.ts` |
| Storefront API | `lib/shopify/storefront-queries.ts` |
| Nav setup doc | `Shopify/docs/NAVIGATION-MENU-SETUP.md` |
| Design system | `docs/DESIGN-SYSTEM.md` |
