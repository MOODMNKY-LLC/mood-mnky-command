# Shopify LABZ Pages and Main Menu

This doc explains how to create storefront pages from LABZ and how to add **MNKY LABZ** and the **Fragrance Wheel** (or other LABZ pages) to your store’s main navigation.

## Creating pages from LABZ

1. In **LABZ**, open **Shopify Store** → **LABZ Pages** (`/store/labz-pages`).
2. Use the **Create page** form: enter a **Title**, optional **Handle**, and choose a **Template** (e.g. **Fragrance Wheel (app embed)**).
3. Click **Create page in Shopify**. The page is created via the Shopify Admin API and appears under **Content → Pages** in Shopify Admin.
4. Ensure the matching **theme template** exists in your theme. For the Fragrance Wheel, the repo includes `Shopify/theme/templates/page.fragrance-wheel.json`. Push the theme when needed:
   ```bash
   shopify theme push --path Shopify/theme --store <your-store>
   ```
   Use `--development` if you are pushing to a development theme first.

## Adding MNKY LABZ to the main navbar

The store’s header uses the **Main menu** (handle: `main-menu`). To show **MNKY LABZ** with a dropdown (e.g. **Fragrance Wheel**) in the nav:

1. In **Shopify Admin**, go to **Content** → **Menus**.
2. Open **Main menu**.
3. **Add a menu item** for the parent:
   - **Name:** `MNKY LABZ`
   - **Link:** leave empty or use `#` (it will act as a dropdown parent).
4. **Add a child item** under **MNKY LABZ**:
   - **Name:** `Fragrance Wheel`
   - **Link:** choose **Pages** → **Fragrance Wheel** (or the page you created with handle `fragrance-wheel`).
5. Save. The theme will show **MNKY LABZ** in the header with **Fragrance Wheel** in its dropdown.

You can add more LABZ pages (e.g. future app-embed pages) as additional child items under **MNKY LABZ**.

## Fragrance Wheel page

- **Template:** `page.fragrance-wheel` (in `Shopify/theme/templates/page.fragrance-wheel.json`).
- **Content:** The template embeds the app’s Fragrance Wheel at `/verse/fragrance-wheel` in an iframe. The app allows framing from `*.myshopify.com` and `*.moodmnky.com` via CSP `frame-ancestors`.
- **App URL:** The iframe URL in the template is set to `https://mnky-command.moodmnky.com`. To change it (e.g. for staging), edit the template in the theme repo and push, or in **Theme Editor** customize the page and edit the **Custom liquid** section content.

## Related

- [SHOPIFY-APP-URL-CONFIG.md](./SHOPIFY-APP-URL-CONFIG.md) – App base URL for theme and embeds.
- [Shopify/docs/APP-BLOCKS-BREAKDOWN.md](../Shopify/docs/APP-BLOCKS-BREAKDOWN.md) – Theme app blocks and MNKY CHAT embed.
