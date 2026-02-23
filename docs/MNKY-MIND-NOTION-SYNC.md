# MNKY MIND – Notion / Supabase two-way sync

MNKY MIND is the collective Notion workspace (databases) used for infra, design, and theme content. This doc describes the two-way sync with Supabase and the LABZ back office section.

## Notion source

- **MNKY_MIND Databases (parent page):**  
  [https://www.notion.so/mood-mnky/MNKY_MIND-Databases-2e1cd2a654228009920ee6fa51188f46](https://www.notion.so/mood-mnky/MNKY_MIND-Databases-2e1cd2a654228009920ee6fa51188f46)
- **Default database ID** used for sync (when the linked DB is this page):  
  `2e1cd2a6-5422-8009-920e-e6fa51188f46`  
  Override with `NOTION_MNKY_MIND_DATABASE_ID` in `.env` if your “collective” content lives in a different database (e.g. a child database under that page).

## Environment

- `NOTION_API_KEY` – Required for sync. Create an integration in Notion, then share the MNKY_MIND database(s) with it.
- `NOTION_MNKY_MIND_DATABASE_ID` – Optional. Defaults to the ID above. Set to the UUID of the specific database to sync (with or without dashes).

## Two-way sync

- **Notion → Supabase:**  
  LABZ **Platform → MNKY MIND** → “Sync from Notion” calls `POST /api/labz/mnky-mind`, which queries the Notion database, fetches each page’s body as markdown, and upserts into `mnky_mind_entries` (keyed by `notion_page_id`).

- **Supabase → Notion:**  
  Edits in Notion are reflected on next “Sync from Notion”. To push changes from LABz back to Notion, use existing Notion update helpers in `lib/notion.ts` (e.g. `updatePageProperties`, or MNKY Manga–specific push helpers). The `mnky_mind_entries` table stores `notion_page_id` for each entry so you can implement “Push to Notion” for title/content when needed.

## Supabase table: `mnky_mind_entries`

- `id`, `notion_page_id` (unique), `notion_database_id`, `title`, `category`, `content_markdown`, `content_code`, `source`, `synced_at`, `created_at`, `updated_at`
- RLS: authenticated read; service role (and admin API) for insert/update/delete.

## LABZ back office

- **Platform → MNKY MIND** (`/platform/mnky-mind`): lists entries from Supabase, link to open in Notion, and “Sync from Notion” button (admin-only). Sidebar: **Automation & Workflows** group; section auto-expands when the route is active.

## API

- `GET /api/labz/mnky-mind` – List entries (authenticated).
- `POST /api/labz/mnky-mind` – Sync from Notion into Supabase (admin only). Returns `{ ok, synced, total, databaseId }`.
