# Shopify LABZ Pages and Main Menu

This doc explains how to create storefront pages from LABZ and how to set up **MOOD LABZ** (or **MNKY LABZ**) in the main navigation with a landing page and dropdown items.

## Creating pages from LABZ

1. In **LABZ**, open **Shopify Store** → **LABZ Pages** (`/store/labz-pages`).
2. Use the **Create page** form: enter a **Title**, optional **Handle**, and choose a **Template** (e.g. **Fragrance Wheel (app embed)**, **Blending Lab (app embed)**, **MOOD LABZ Landing**, etc.).
3. Click **Create page in Shopify**. The page is created via the Shopify Admin API and appears under **Content → Pages** in Shopify Admin.
4. Ensure the matching **theme template** exists in your theme. Repo templates live under `Shopify/theme/templates/`. Push the theme when needed:
   ```bash
   shopify theme push --path Shopify/theme --store <your-store>
   ```
   Use `--development` if you are pushing to a development theme first. You can also use **Upload from repo** in LABZ Pages for known templates (e.g. `page.blending-guide.json`).

## MOOD LABZ menu structure (recommended)

The store’s header uses the **Main menu** (handle: `main-menu`). To show **MOOD LABZ** with a **landing page** and a **dropdown** of LABZ pages:

1. In **Shopify Admin**, go to **Content** → **Menus**.
2. Open **Main menu**.
3. **Add a menu item** for the parent:
   - **Name:** `MOOD LABZ` (or `MNKY LABZ`)
   - **Link:** **Pages** → **MOOD LABZ** (or the page you created with handle `labz` / `mood-labz`). This is the **landing page**; clicking the nav item goes here instead of only opening the dropdown.
4. **Add child items** under **MOOD LABZ** (in order):
   - **Fragrance Wheel** → Pages → Fragrance Wheel (handle `fragrance-wheel`)
   - **Blending Lab** → Pages → Blending Lab (handle `blending-guide`)
   - **Glossary** → Pages → Glossary (handle `glossary`)
   - **Formulas** → Pages → Formulas (handle `formulas`)
   - **Fragrance Oils** → Pages → Fragrance Oils (handle `fragrance-oils`)
5. Save. The theme will show **MOOD LABZ** in the header; the parent link goes to the landing page, and the dropdown lists the five content pages.

If you prefer the parent to be dropdown-only (no landing link), set the parent **Link** to empty or `#`.

## Theme templates (app embeds)

Each content page uses a **custom-liquid** section that embeds the app in an **iframe**. The app allows framing from `*.myshopify.com` and `*.moodmnky.com` via CSP `frame-ancestors` for all `/verse/*` routes.

| Template suffix     | Theme file                              | App route (iframe)              | Purpose                    |
|---------------------|-----------------------------------------|----------------------------------|----------------------------|
| `fragrance-wheel`   | `page.fragrance-wheel.json`             | `/verse/fragrance-wheel`         | Fragrance Wheel            |
| `blending-guide`    | `page.blending-guide.json`              | `/verse/blending-guide`          | Blending Lab               |
| `glossary`          | `page.glossary.json`                    | `/verse/glossary`                | Fragrance Note Glossary    |
| `formulas`          | `page.formulas.json`                    | `/verse/formulas`                | Formula Catalog            |
| `fragrance-oils`    | `page.fragrance-oils.json`              | `/verse/fragrance-oils`          | Fragrance Oil Catalog      |
| `labz-landing`      | `page.labz-landing.json`                | — (HTML links only)              | MOOD LABZ landing page     |

- **App URL:** Iframe URLs in the templates are set to `https://mnky-command.moodmnky.com`. To change (e.g. for staging), edit the template in the theme repo and push, or in **Theme Editor** customize the page and edit the **Custom liquid** section content.
- **CSP:** The Next.js app sets `Content-Security-Policy: frame-ancestors` for the path pattern `/verse/:path*`, so any Verse route can be embedded in the store. See `next.config.mjs`.
- **Public access:** The five content routes above are **public** (no login required). Middleware allows unauthenticated access so store visitors see the iframe content when not logged into the Verse. See `lib/supabase/middleware.ts` (`publicVersePaths`).

## Fragrance Wheel page (existing)

- **Template:** `page.fragrance-wheel` (in `Shopify/theme/templates/page.fragrance-wheel.json`).
- **Content:** The template embeds the app at `/verse/fragrance-wheel` in an iframe.

## Adding more LABZ pages

You can add more LABZ pages (e.g. future app-embed pages) as additional child items under **MOOD LABZ**. Create the page in LABZ Pages with the correct template suffix, ensure the theme template exists (add to repo and push, or upload from repo in LABZ Pages), then add a menu item in Admin → Main menu linking to that page.

## Related

- [SHOPIFY-APP-URL-CONFIG.md](./SHOPIFY-APP-URL-CONFIG.md) – App base URL for theme and embeds.
- [Shopify/docs/APP-BLOCKS-BREAKDOWN.md](../Shopify/docs/APP-BLOCKS-BREAKDOWN.md) – Theme app blocks and MNKY CHAT embed.
