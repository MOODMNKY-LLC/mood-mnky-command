# n8n Image Generation Workflow

This document describes how to set up an n8n workflow that generates fragrance scene images, stores them in Supabase, and maps the URLs to Notion.

## Image Workflows (Use Cases)

| Workflow | Description | Endpoints |
|----------|-------------|-----------|
| **Studio – Fragrance Scene** | Generate bespoke fragrance scene images in the app. Select a fragrance, optionally add a mascot reference for brand consistency. Images stored in ai-generations. | `POST /api/images/generate` |
| **n8n – Batch Fragrance Scenes** | Automated workflow for generating images for multiple fragrances. Trigger via schedule or manual. Calls generate API, then optionally updates Notion page image. | `POST /api/images/generate`, `POST /api/notion/update-image` |
| **Media Library – Assign & Sync** | Assign an existing image to a fragrance in Media Library. Use "Sync to Notion" to push the image URL to the Notion fragrance page (one-way). | `PATCH /api/media/[id]`, `POST /api/notion/update-image` |
| **Upload from URL** | Store an image from an external URL into Supabase. Used by n8n when the image source is external. Requires MEDIA_API_KEY. | `POST /api/images/upload-from-url` |

**Model**: Default is `gpt-image-1.5` (OpenAI).

## Prerequisites

- n8n instance (self-hosted or cloud)
- MOOD MNKY LABZ app deployed (Vercel URL)
- Environment variables configured:
  - `OPENAI_API_KEY` - In app (Vercel), for generate API
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

---

## n8n-Only: Fragrance Oil Image Generation Workflow

This workflow generates images **entirely within n8n** (no app API calls). It reads from the Notion MNKY Science Fragrance Oils database, generates images via OpenAI (Edit operation with style reference), uploads to Supabase Storage, and updates Notion.

**Workflow ID**: `8oAetc3HCvONKo2Bb85Nf`
**Flow**: Form Trigger → Get brand assets → Build form options → Select style reference (Form page 2) → [Get database pages, Fetch style reference] → Loop → **Attach reference to batch** (Code) → Edit image (OpenAI) → Upload (S3) → Set public URL → Update database page (Notion)

### Integrated Brand Asset Selection (Single Workflow)

The workflow fetches brand assets from Supabase and shows them in a dropdown on the second form page. No separate workflow needed.

**User flow**:

1. Open the form URL → **Page 1**: "Fragrance Oil Image Generation" — check "Continue to style selection" and click Submit
2. **Page 2**: Dropdown "Select Style Reference" — options are `file_name (public_url)` from the `brand-assets` bucket; pick one and Submit
3. Generation runs for all fragrance oils in the Notion database

**Form** (path: `fragrance-image-gen`):
- Page 1: Checkbox "Continue to style selection" (required)
- Page 2: Dynamic dropdown with brand assets (from Supabase `media_assets`, filtered by `bucket_id = brand-assets`, `mime_type` like `image/%`)

**Workflow must be active** for the form to be available. Form URL: `https://<your-n8n-host>/form/fragrance-image-gen`

### Prerequisites: Supabase Credentials

**1. Supabase (for Get brand assets)**

Create a Supabase credential in n8n using the **service role key** (bypasses RLS):

- **n8n** → Credentials → Add credential → Supabase
- **Host**: `https://coevjitstmuhdhbyizpk.supabase.co`
- **Service Role Key**: from Supabase Dashboard → Project Settings → API
- Assign to the **"Get brand assets"** node

**2. Supabase S3 (for Upload)**

Supabase Storage is S3-compatible:

1. **Supabase Dashboard** → Project Settings → Storage → S3 Access Keys → Create access key pair
2. **n8n** → Credentials → Add credential → S3
3. **Endpoint**: `https://coevjitstmuhdhbyizpk.supabase.co/storage/v1/s3`, **Region**: `us-east-1`
4. Assign to the **"Upload a file"** node

### Style Reference (Dynamic from Brand Assets)

- **Get brand assets**: Supabase Get Many from `media_assets` filtered by `bucket_id = brand-assets`, `mime_type ilike image/%`
- **Build form options**: Code node builds a dropdown with `file_name (public_url)` per asset
- **Select style reference**: Form page 2 with dynamic dropdown; submitted value includes the URL
- **Fetch style reference**: HTTP Request uses the selected URL; Response Format = **File**; Binary Property = `ref` (or `data` as fallback)
- **Attach reference to batch** (Code): Gets reference binary from Fetch, attaches it to each batch item as `binary.ref`
- **Edit an image** (OpenAI): Binary Field = `ref`; Input Fidelity = **high**

### Loop Configuration (Process All Notion Pages)

- **Loop Over Items** (Split In Batches): batch size 1, processes each Notion database page sequentially
- **Connections**: Loop output 0 (batch items) → **Attach reference to batch**; Update database page → Loop (loop-back); Loop output 1 (done) unconnected
- When Update completes, execution returns to the Loop, which emits the next page; this repeats until all pages are processed

### Workflow Configuration

- **Upload node**: bucket `ai-generations`, path `fragrance-oils/{{ pageId }}.png`, binary property `data`
- **Notion Update**: sets both `image` (url) and `mnky-image` (file) properties with the Supabase public URL
- **Public URL format**: `https://coevjitstmuhdhbyizpk.supabase.co/storage/v1/object/public/ai-generations/fragrance-oils/{pageId}.png`
