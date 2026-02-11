# Notion Sync

Sync fragrance oils, collections, and formulas from your MNKY_MIND Notion workspace into Supabase. Data flows one-way: Notion → Supabase.

## What Gets Synced

| Database | Contents |
|----------|----------|
| **Fragrance Oils** | Name, description, notes, family, Notion page ID |
| **Collections** | Collection definitions |
| **Formulas** | Formula catalog (when configured) |
| **Fragrance Notes** | Glossary / MNKY Note Glossary |

## Running a Sync

1. Go to **Notion Sync** in the sidebar
2. Find the database card (e.g., Fragrance Oils)
3. Click **Sync** (GET or POST depending on the endpoint)
4. Wait for completion – Results show count and synced items

## Sync Status

- **Last synced** – Timestamp of last successful sync
- **Total** – Number of records synced
- **Error** – Message if sync failed (e.g., Notion API key, permissions)

## Prerequisites

- **NOTION_API_KEY** in environment
- Notion database shared with the integration
- Supabase connected (local or production)

## Two-Way Considerations

- **Fragrance oils** – Edits in the app can update Notion (e.g., image URL)
- **Fragrance notes** – Supports to-supabase and to-notion directions
- See Admin Docs for sync API details
