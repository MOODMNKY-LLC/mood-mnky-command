# n8n Image Generation Workflow

This document describes how to set up an n8n workflow that generates fragrance scene images, stores them in Supabase, and maps the URLs to Notion.

## Prerequisites

- n8n instance (self-hosted or cloud)
- MOOD MNKY Lab app deployed (Vercel URL)
- Environment variables configured:
  - `OPENAI_API_KEY` - In app (Vercel)
  - `CDN_API_KEY` - In app (Vercel), for n8n API auth
  - `NOTION_API_KEY` - In app (Vercel)

## API Endpoints

### 1. Generate Image

**POST** `{{APP_URL}}/api/images/generate`

**Auth**: Supabase session (browser) or `CDN_API_KEY` via header (server)

**Body**:
```json
{
  "prompt": "The MOOD MNKY mascot in a Caribbean casita...",
  "referenceImageUrl": "https://...",
  "fragranceId": "uuid",
  "fragranceName": "Caribbean Casita",
  "model": "gpt-image-1",
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

**Auth**: `x-api-key: {{CDN_API_KEY}}`

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

**Auth**: `x-api-key: {{CDN_API_KEY}}` or Supabase session

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
   - Headers: `x-api-key: {{$env.CDN_API_KEY}}` (if using API key auth)
   - Note: Browser auth requires a different flow (use Studio in-app for that)

3. **Update Notion node**:
   - Method: POST
   - URL: `{{$env.APP_URL}}/api/notion/update-image`
   - Body: `{ "notionPageId": "{{$node["HTTP Request"].json.notionPageId}}", "imageUrl": "{{$node["HTTP Request"].json.publicUrl}}" }`
   - Headers: `x-api-key: {{$env.CDN_API_KEY}}`

4. **Data flow**: The generate API returns `publicUrl`. You need `notionPageId` from your fragrance data (Supabase `fragrance_oils.notion_id` or similar). Map fragrance ID to Notion page ID in your workflow.

## Notion Page ID Mapping

- Fragrance oils have `notion_id` in Supabase (from sync)
- Use that as `notionPageId` when calling update-image
- Ensure the Notion fragrance database has an "Image URL" or "Image" (url type) property

## Environment Variables (n8n)

- `APP_URL`: Your Vercel app URL (e.g. `https://mood-mnky-lab.vercel.app`)
- `CDN_API_KEY`: Set in Vercel, matching value in n8n credentials
