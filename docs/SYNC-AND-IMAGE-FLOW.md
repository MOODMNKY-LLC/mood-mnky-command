# Fragrance Sync and Image Flow

This document describes how fragrance data flows between Notion, Supabase, and the app, and how images are handled.

## Data Flow

### Fragrance Oils Source of Truth

- **Fragrance oils** displayed in the app come from **Supabase** (`fragrance_oils` table).
- **Notion** is the authoring source; data is synced to Supabase via POST to `/api/notion/sync/fragrance-oils`.
- After sync, the Fragrances page, Blending Calculator, and Product Builder all use `/api/fragrance-oils` (Supabase).

### Sync Flow

1. **Notion → Supabase**: Run `POST /api/notion/sync/fragrance-oils` (from the Notion Sync panel or n8n) to pull fragrance oils from Notion into Supabase.
2. **Edits**: When a fragrance is edited in the app, the PATCH ` /api/fragrance-oils/[id]` handler updates both Supabase and Notion (`updateFragrancePage`); supports `imageUrl` for the Notion "Image URL" property.

## Image Flow

### Sync to Notion (One-Way)

- **Studio** and **Media Library** use "Sync to Notion" to push the selected image URL to the Notion page's "Image URL" property.
- This is **one-way**: app → Notion. Images set only in Notion are not automatically written back to Supabase.

### Fragrance Display in App

- The app displays fragrance images from **Supabase** `fragrance_oils.image_url`.
- This field is set when:
  - Images are generated in Studio and assigned to a fragrance
  - Images are assigned from the Media Library and synced
  - The n8n workflow updates the image URL (via API or Notion)
- If images are only updated in Notion (e.g. by n8n workflow), run a sync or an update to ensure `image_url` is written to Supabase.

### n8n Integration

- See `docs/N8N-IMAGE-WORKFLOW.md` for image workflows and use cases.
- **Image workflows**: Studio (manual), n8n batch (automated), Media Library (assign & sync), Upload from URL.
- **Model**: `gpt-image-1.5` (latest OpenAI image model) is used for all AI generation.
- The workflow uses `APP_URL`, `CDN_API_KEY`, and endpoints for generate, upload-from-url, and update-image.
