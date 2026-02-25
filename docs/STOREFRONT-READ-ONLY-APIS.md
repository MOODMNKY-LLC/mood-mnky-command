# Storefront read-only APIs

These HTTP APIs are **public** (no authentication required) and are used by the Verse store-embed pages and by theme app blocks or future Liquid + JS. They are intended for read-only access from the storefront.

## Base URL

- **Production:** `https://mnky-command.moodmnky.com` (or your deployed app URL)
- **Development:** `http://localhost:3000`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/fragrance-notes` | List fragrance notes (glossary). Query: `letter`, `q` (search). |
| GET | `/api/fragrance-notes/[slug]` | Single fragrance note by slug. |
| GET | `/api/formulas` | List formulas. Query: `category` (e.g. `skincare`, `candle`). |
| GET | `/api/fragrance-oils` | List fragrance oils (catalog). |

## Usage

- **Verse iframe pages** (`/verse/glossary`, `/verse/formulas`, `/verse/fragrance-oils`) call these APIs from the server or client to render content.
- **Theme / app blocks:** Future Liquid + JavaScript can call these URLs from the browser (same origin or CORS if configured) to power native store sections.
- **Access:** Middleware does not require auth for `/api/*`; these endpoints use the app’s Supabase admin client and do not expose write operations.

## Related

- [SHOPIFY-LABZ-PAGES-AND-MENU.md](./SHOPIFY-LABZ-PAGES-AND-MENU.md) – MOOD MNKY LABZ pages and iframe routes.
- Verse routes are listed in `lib/supabase/middleware.ts` (`publicVersePaths`).
