# Notion ↔ App Asset Slots two-way sync

App Asset Slots can optionally sync with a Notion database under MNKY_MIND for slot metadata and push image URLs after upload.

## Notion database (optional)

Create a database in Notion (e.g. under **MNKY_MIND Databases**) named **App Asset Slots** (or **Front-facing assets**). Share it with your Notion integration.

Suggested properties:

| Property   | Type      | Purpose                                      |
|-----------|-----------|----------------------------------------------|
| Slot Key  | Rich text | Unique key, e.g. `main.services.mnky-cloud`   |
| Label     | Title     | Display name, e.g. MNKY CLOUD                 |
| Category  | Select    | e.g. `main-services`, `main-hero`            |
| Route Hint| Rich text | e.g. `/main/services`                        |
| Current URL | URL     | Updated by LABZ when you upload (push only)  |

Set `NOTION_APP_ASSETS_DATABASE_ID` in `.env` to the database ID (with or without dashes).

## Sync directions

- **Notion → Supabase (pull):** In **Create & Chat → App Assets**, click **Sync from Notion**. This calls `POST /api/app-assets/sync-from-notion`, which reads the Notion database and upserts `app_asset_slots` with slot_key, label, category, route_hint, and notion_page_id. Existing slots are matched by `slot_key`; new pages create new slots. Image URLs and `media_asset_id` are not overwritten from Notion.

- **Supabase → Notion (push):** When you upload or replace an image for a slot that has `notion_page_id` set, LABZ pushes the new image URL to the Notion page’s **Current URL** property (see `lib/notion.ts` → `pushAppAssetSlotUrlToNotion`).

## APIs

- `POST /api/app-assets/sync-from-notion` – Pull slot metadata from Notion (admin only). Requires `NOTION_APP_ASSETS_DATABASE_ID` and `NOTION_API_KEY`.
