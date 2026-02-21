# Manga: Where It’s Stored, How It’s Rendered, and Where to Upload Images

## 1. Where are manga stored?

**Supabase (canonical store)**  
All manga content is stored in Postgres:

| Table | Purpose |
|-------|--------|
| `mnky_collections` | Series (e.g. World Traveler Series). Columns: name, slug, shopify_collection_gid, notion_id. |
| `mnky_issues` | One issue per collection. Columns: collection_id, issue_number, title, slug, status (draft\|published), arc_summary, **cover_asset_url**, published_at, notion_id. |
| `mnky_chapters` | One chapter per fragrance in an issue. Columns: issue_id, fragrance_name, shopify_product_gid, setting, chapter_order, notion_id. |
| `mnky_panels` | Storyboard panels per chapter. Columns: chapter_id, panel_number, script_text, asset_prompt, **asset_url**, notion_id. |
| `mnky_hotspots` | Shoppable positions on a panel. Columns: panel_id, type, shopify_gid, x, y, label, tooltip, notion_id. |

Migrations: `supabase/migrations/20260220130000_manga_magazine_tables.sql`, `20260222110000_manga_notion_id.sql`.

**Notion (optional authoring source)**  
Notion is **connected** via one-way sync: Notion → Supabase.  
Sync runs when you trigger it (Verse Backoffice → Manga → “Sync from Notion” or `POST /api/notion/sync/manga`).  
Required env for manga sync:

- `NOTION_MNKY_COLLECTIONS_DATABASE_ID`
- `NOTION_MNKY_ISSUES_DATABASE_ID`

Optional (for chapters, panels, hotspots):

- `NOTION_MNKY_CHAPTERS_DATABASE_ID`
- `NOTION_MNKY_PANELS_DATABASE_ID`
- `NOTION_MNKY_HOTSPOTS_DATABASE_ID`

Notion property → Supabase column mapping (sync logic in `apps/web/app/api/notion/sync/manga/route.ts`):

- **Collections:** Name/Title → name, Slug → slug.
- **Issues:** Title, Slug, Issue Number, Status, Arc Summary, **Cover URL** → cover_asset_url, Published Date, relation → collection_id.
- **Chapters:** Issue relation, Fragrance Name, Shopify Product GID, Setting, **Chapter Order** → chapter_order.
- **Panels:** Chapter relation, **Panel Number**, **Script Text**, **Asset Prompt**, **Asset URL** → asset_url.
- **Hotspots:** Panel relation, Type, Shopify GID, X, Y, Label, Tooltip.

So: **manga are stored in Supabase; Notion is an optional source that syncs into those tables.**

---

## 2. How are they rendered?

- **Public reader (Verse)**  
  - Issue list: `app/(storefront)/verse/issues/page.tsx` — lists published issues (title, cover_asset_url, arc_summary).  
  - Issue detail: `app/(storefront)/verse/issues/[slug]/page.tsx` — one issue, chapters list.  
  - Chapter reader: `app/(storefront)/verse/issues/[slug]/chapters/[n]/page.tsx` — loads issue, chapter, panels, hotspots from Supabase; passes panels to `ChapterReaderClient`.  
  - **Panel images:** `components/verse/chapter-reader-client.tsx` renders each panel’s `asset_url` in an `<img>` (and script_text as caption). Hotspots overlay the image and link to products.

- **APIs**  
  - `GET /api/mag/issues`, `GET /api/mag/issues/[slug]`, `GET /api/mag/issues/[slug]/chapters` — read issues/chapters from Supabase.  
  - Read telemetry: `POST /api/mag/read-event`. Quiz and download routes use the same Supabase manga tables.

So: **rendering is Supabase-backed; Notion is not used at render time**, only as a sync source.

---

## 3. Where can you upload images to display in manga?

**Dedicated Storage bucket: `manga-assets`**  
Manga cover and panel images are stored in Supabase Storage in the **manga-assets** bucket (see `apps/web/lib/supabase/storage.ts` and migration `supabase/migrations/20260221150000_manga_assets_bucket.sql`). Path convention: **Covers:** `covers/{issue_id}.{ext}`; **Panels:** `panels/{panel_id}.{ext}`. The bucket is public read; uploads are performed server-side with admin client (API routes require manga admin auth).

**LABZ Verse Backoffice upload (recommended)**  
On the issue detail page (`/verse-backoffice/manga/[slug]`): use the **Cover** card to upload/change cover (writes to `manga-assets/covers/`, updates `mnky_issues.cover_asset_url`, and pushes Cover URL to Notion when `notion_id` exists); in **Chapters & panels**, each panel has an "Upload" button (writes to `manga-assets/panels/`, updates `mnky_panels.asset_url`, pushes Asset URL to Notion when `notion_id` exists). See [NOTION-MANGA-2WAY-SYNC.md](./NOTION-MANGA-2WAY-SYNC.md) for 2-way sync.

**URL-based (alternative)**  
Images are **URL-based** in the DB:

- **Panel image:** `mnky_panels.asset_url` (text) — any URL (e.g. Supabase Storage, S3, Imgur, Notion-hosted, etc.).
- **Issue cover:** `mnky_issues.cover_asset_url` (text) — same.

**Other ways:**

1. **Notion (recommended if you use Notion)**  
   - In your **MNKY Manga Panels** database, add a URL property (e.g. “Asset URL” or “Asset”).  
   - Put the image somewhere (e.g. Notion image block, Supabase Storage, external host), copy the **public URL**, and paste it into that URL property.  
   - Run **Sync from Notion**; the sync maps that property to `mnky_panels.asset_url` (see `getProp(props, "Asset URL", "Asset", "asset_url")` in `app/api/notion/sync/manga/route.ts`).  
   - For issue covers, use the **Cover URL** (or equivalent) field in your MNKY Manga Issues database; sync maps it to `mnky_issues.cover_asset_url`.

2. **Supabase Storage + URL**  
   - Upload to an existing bucket (e.g. `brand-assets` or a dedicated bucket you create) via Storage API or dashboard.  
   - Get the public URL and set it in Notion (then sync) or update the row in Supabase (`mnky_panels.asset_url` or `mnky_issues.cover_asset_url`).

3. **Direct DB / backoffice**  
   - Verse Backoffice (`/verse-backoffice/manga`, `/verse-backoffice/manga/[slug]`) currently lists issues and chapters; it does **not** yet have panel editing or image upload.  
   - You can set `asset_url` / `cover_asset_url` by:  
     - Updating rows in Supabase (SQL or Table Editor), or  
     - Adding a simple “Edit panel” / “Set cover URL” form in backoffice that updates `mnky_panels` / `mnky_issues`.

**Summary:**  
Upload images to any host you like; then put that **URL** into either Notion (and sync) or into Supabase (`mnky_panels.asset_url`, `mnky_issues.cover_asset_url`). There is no dedicated “manga image upload” flow yet; a future improvement could be a backoffice “Upload panel image” that writes to Storage and sets `asset_url` for you.

---

## 4. Notion ↔ Supabase connection (recap)

- **Pull (Notion → Supabase):** One-way sync overwrites/upserts by `notion_id`.
- **Trigger:** Manual (Verse Backoffice “Sync from Notion” or API `POST /api/notion/sync/manga`).
- **Required:** Collections + Issues DB IDs in env. Optional: Chapters, Panels, Hotspots DB IDs.
- **Panel images:** In Notion, set the **Asset URL** (or “Asset” / “asset_url”) property on the panel page; sync copies it to `mnky_panels.asset_url`, which the chapter reader then renders.

**Push (Supabase → Notion):** When you upload a cover or panel image in LABZ, the new URL is written to Supabase and, if the row has a `notion_id`, pushed to the corresponding Notion page (Cover URL / Asset URL). See [NOTION-MANGA-2WAY-SYNC.md](./NOTION-MANGA-2WAY-SYNC.md).

For full sync details and property names, see `apps/web/app/api/notion/sync/manga/route.ts` and `docs/COMPANION-MANGA-ROADMAP.md`.
