# n8n Image Generation Workflow

This document describes how to set up an n8n workflow that generates fragrance scene images, stores them in Supabase, and maps the URLs to Notion.

## Image Workflows (Use Cases)

| Workflow | Description | Endpoints |
|----------|-------------|-----------|
| **Studio – Fragrance Scene** | Generate bespoke fragrance scene images in the app. Select a fragrance, optionally add a mascot reference for brand consistency. Images stored in ai-generations. | `POST /api/images/generate` |
| **n8n – Batch Fragrance Scenes** | Automated workflow for generating images for multiple fragrances. Trigger via schedule or manual. Calls generate API, then optionally updates Notion page image. | `POST /api/images/generate`, `POST /api/notion/update-image` |
| **Media Library – Assign & Sync** | Assign an existing image to a fragrance in Media Library. Use "Sync to Notion" to push the image URL to the Notion fragrance page (one-way). | `PATCH /api/media/[id]`, `POST /api/notion/update-image` |
| **Upload from URL** | Store an image from an external URL into Supabase. Used by n8n when the image source is external. Requires MEDIA_API_KEY. | `POST /api/images/upload-from-url` |

**Model**: All AI generation uses `gpt-image-1.5` (latest OpenAI image model) by default.

## Prerequisites

- n8n instance (self-hosted or cloud)
- MOOD MNKY Lab app deployed (Vercel URL)
- Environment variables configured:
  - `OPENAI_API_KEY` - In app (Vercel)
  - `MEDIA_API_KEY` - In app (Vercel), for n8n API auth (legacy: CDN_API_KEY)
  - `NOTION_API_KEY` - In app (Vercel)

## API Endpoints

### 1. Generate Image

**POST** `{{APP_URL}}/api/images/generate`

**Auth**: Supabase session (browser) or `MEDIA_API_KEY` via header (server)

**Body**:
```json
{
  "prompt": "The MOOD MNKY mascot in a Caribbean casita...",
  "referenceImageUrl": "https://...",
  "fragranceId": "uuid",
  "fragranceName": "Caribbean Casita",
  "model": "gpt-image-1.5",
  "size": "1024x1024",
  "quality": "high"
}
```

**Response**:
```json
{
  "asset": { "id": "...", "public_url": "https://...", ... },
  "publicUrl": "https://..."
}
```

### 2. Upload from URL

**POST** `{{APP_URL}}/api/images/upload-from-url`

**Auth**: `x-api-key: {{MEDIA_API_KEY}}`

**Body**:
```json
{
  "url": "https://...",
  "bucket": "ai-generations",
  "userId": "uuid",
  "tags": ["ai-generated"],
  "linkedEntityType": "fragrance",
  "linkedEntityId": "uuid",
  "category": "fragrance-scene"
}
```

### 3. Update Notion Image

**POST** `{{APP_URL}}/api/notion/update-image`

**Auth**: `x-api-key: {{MEDIA_API_KEY}}` or Supabase session

**Body**:
```json
{
  "notionPageId": "page-uuid",
  "imageUrl": "https://..."
}
```

## n8n Workflow Structure

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  Trigger    │────▶│  HTTP: Generate       │────▶│  HTTP: Update Notion │
│  (Manual/   │     │  /api/images/generate │     │  /api/notion/        │
│   Schedule) │     │                      │     │  update-image        │
└─────────────┘     └──────────────────────┘     └─────────────────────┘
                              │
                              │  (Generate stores in Supabase automatically)
                              ▼
                    ┌──────────────────────┐
                    │  Response: asset,    │
                    │  publicUrl          │
                    └──────────────────────┘
```

## Setup Steps

1. **Create workflow** in n8n with 3 nodes:
   - Trigger (Manual or Schedule)
   - HTTP Request: POST to `https://your-app.vercel.app/api/images/generate`
   - HTTP Request: POST to `https://your-app.vercel.app/api/notion/update-image`

2. **Generate node**:
   - Method: POST
   - URL: `{{$env.APP_URL}}/api/images/generate`
   - Body: JSON with `prompt`, `fragranceId`, `fragranceName`, optional `referenceImageUrl`
   - Headers: `x-api-key: {{$env.MEDIA_API_KEY}}` (if using API key auth)
   - Note: Browser auth requires a different flow (use Studio in-app for that)

3. **Update Notion node**:
   - Method: POST
   - URL: `{{$env.APP_URL}}/api/notion/update-image`
   - Body: `{ "notionPageId": "{{$node["HTTP Request"].json.notionPageId}}", "imageUrl": "{{$node["HTTP Request"].json.publicUrl}}" }`
   - Headers: `x-api-key: {{$env.MEDIA_API_KEY}}`

4. **Data flow**: The generate API returns `publicUrl`. You need `notionPageId` from your fragrance data (Supabase `fragrance_oils.notion_id` or similar). Map fragrance ID to Notion page ID in your workflow.

## Notion Page ID Mapping

- Fragrance oils have `notion_id` in Supabase (from sync)
- Use that as `notionPageId` when calling update-image
- Ensure the Notion fragrance database has an "Image URL" or "Image" (url type) property

## Environment Variables (n8n)

- `APP_URL`: Your Vercel app URL (e.g. `https://mood-mnky-lab.vercel.app`)
- `MEDIA_API_KEY`: Set in Vercel, matching value in n8n credentials (legacy: CDN_API_KEY)
