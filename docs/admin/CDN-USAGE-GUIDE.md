# MOOD MNKY Lab – CDN Usage Guide

This guide explains how to use the MOOD MNKY Lab asset delivery system (Supabase Storage + image transforms) for uploading, displaying, and managing digital assets. For architecture details, see [ASSET-AND-CDN-ARCHITECTURE.md](./ASSET-AND-CDN-ARCHITECTURE.md).

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Prerequisites](#prerequisites)
3. [Choosing the Right Bucket](#choosing-the-right-bucket)
4. [Uploading Assets](#uploading-assets)
5. [Displaying Images](#displaying-images)
6. [API Reference](#api-reference)
7. [Programmatic URL Building](#programmatic-url-building)
8. [Private Files](#private-files)
9. [External Workflows (n8n)](#external-workflows-n8n)
10. [Copy URL and Notion Sync](#copy-url-and-notion-sync)
11. [Troubleshooting](#troubleshooting)

---

## Quick Reference

### Transform Presets

| Preset | Size | Format | Use Case |
|--------|------|--------|----------|
| `thumbnail` | 300px | WebP 80% | Grid thumbnails, list views |
| `medium` | 800px | WebP 85% | Detail previews, dialogs |
| `full` | Original | Original | Copy URL, Notion sync, download |

### Buckets at a Glance

| Bucket | Max Size | Accepts | Typical Use |
|--------|----------|---------|-------------|
| `product-images` | 10 MB | JPEG, PNG, WebP, GIF, SVG | Shopify product photos |
| `ai-generations` | 25 MB | JPEG, PNG, WebP | AI-generated fragrance scenes |
| `brand-assets` | 25 MB | Images, video, PDF | Logos, mascots, brand materials |
| `user-avatars` | 2 MB | JPEG, PNG, WebP | Profile pictures |
| `private-documents` | 50 MB | Any | Internal documents (not public) |

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/media` | GET | List assets (with `thumbnail_url`, `medium_url`) |
| `/api/media/[id]` | PATCH, DELETE | Update metadata, delete asset |
| `/api/media/[id]/image?preset=thumbnail` | GET | Redirect to transformed image |
| `/api/media/[id]/file` | GET | Redirect to signed URL (private files) |
| `/api/assets?source=media\|fragrance\|all` | GET | Unified asset registry |
| `/api/images/generate` | POST | Generate AI image (OpenAI) |
| `/api/images/upload-from-url` | POST | Store image from URL |
| `/api/notion/update-image` | POST | Sync image URL to Notion |

---

## Prerequisites

- **Supabase Pro plan** – Required for image transformations (thumbnail, medium). Without it, transform URLs may fail.
- **Environment variables**:
  - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
  - `MEDIA_API_KEY` – For n8n and server-side API auth (upload-from-url, update-image)
  - `OPENAI_API_KEY` – For image generate
- **Authenticated user** – Most operations require a Supabase session. API key auth is used only for server-to-server (n8n) workflows.

---

## Choosing the Right Bucket

Use this decision flow:

1. **Is it for a Shopify product?** → `product-images`
2. **Is it AI-generated (Studio, n8n)?** → `ai-generations`
3. **Is it a logo, mascot, video, or PDF?** → `brand-assets`
4. **Is it a user profile picture?** → `user-avatars`
5. **Is it an internal document?** → `private-documents`

---

## Uploading Assets

### 1. Browser Upload (Media Library)

In the Media Library page (`/media`):

1. Choose a bucket from the dropdown.
2. Drag files onto the drop zone or click to select.
3. Files are validated and uploaded to Supabase.
4. Assets are saved to `media_assets` with `public_url`, `thumbnail_url`, and `medium_url`.

### 2. Browser Upload (MediaPicker Component)

Use in forms (e.g. product builder):

```tsx
import { MediaPicker } from "@/components/media/media-picker"

<MediaPicker
  bucket="product-images"
  label="Product Images"
  maxFiles={5}
  value={urls}
  onChange={setUrls}
  onAssetsUploaded={(assets) => { /* optional */ }}
  linkedEntityType="product"
  linkedEntityId={productId}
  tags={["product"]}
/>
```

### 3. Programmatic Upload (useSupabaseUpload Hook)

For custom upload UIs:

```tsx
import { useSupabaseUpload } from "@/hooks/use-supabase-upload"
import { Dropzone } from "@/components/media/dropzone"

const upload = useSupabaseUpload({
  bucket: "ai-generations",
  maxFiles: 5,
  linkedEntityType: "fragrance",
  linkedEntityId: fragranceId,
  tags: ["fragrance-scene"],
  onUploadComplete: (assets) => {
    // assets have public_url, thumbnail_url, medium_url
  },
})

// Use upload.files, upload.addFiles, upload.upload, etc.
```

### 4. Upload from URL (API)

For n8n or external systems:

```bash
curl -X POST "https://your-app.vercel.app/api/images/upload-from-url" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_MEDIA_API_KEY" \
  -d '{
    "url": "https://example.com/image.jpg",
    "bucket": "ai-generations",
    "userId": "user-uuid",
    "tags": ["imported"],
    "linkedEntityType": "fragrance",
    "linkedEntityId": "fragrance-uuid",
    "category": "fragrance-scene"
  }'
```

Required: `url`, `userId`. Optional: `bucket`, `tags`, `linkedEntityType`, `linkedEntityId`, `category`, `fileName`.

### 5. AI Generate (Studio or API)

- **In-app**: Use Studio (`/studio`) to generate fragrance scene images.
- **API**: `POST /api/images/generate` – see [API Reference](#api-reference).

---

## Displaying Images

### Option A: Use API-Enriched URLs (Recommended)

Media API and asset registry return `thumbnail_url` and `medium_url` for images. Use them directly:

```tsx
// Grid thumbnails
<img
  src={asset.thumbnail_url ?? asset.public_url ?? "/placeholder.svg"}
  alt={asset.alt_text || asset.file_name}
  className="h-full w-full object-cover"
/>

// Detail preview
<img
  src={asset.medium_url ?? asset.public_url ?? "/placeholder.svg"}
  alt={asset.alt_text || asset.file_name}
  className="max-h-[400px] object-contain"
/>
```

### Option B: Unified Asset URL Builder

When you have URL strings or need client-side URL building:

```tsx
import { getAssetUrl, getTransformedUrl } from "@/lib/asset-url"

// With asset object
const thumbnailUrl = getAssetUrl(asset, "thumbnail")
const mediumUrl = getAssetUrl(asset, "medium")

// With raw URL string
const thumbnailUrl = getTransformedUrl(publicUrl, "thumbnail")
```

### Option C: Next.js Image (with Optimizer)

The custom loader applies transforms for Supabase URLs:

```tsx
import Image from "next/image"

<Image
  src={asset.public_url}
  width={300}
  height={300}
  alt={asset.alt_text || asset.file_name}
/>
```

### Option D: Image Proxy URL

Use when you need a URL string (e.g. in `src` or `href`) that redirects to a transformed image:

```
/api/media/{assetId}/image?preset=thumbnail
/api/media/{assetId}/image?preset=medium
/api/media/{assetId}/image?preset=full
```

### Fragrance Images

Fragrance oils API returns `thumbnailUrl` for Supabase-stored images:

```tsx
<img
  src={oil.thumbnailUrl ?? oil.imageUrl}
  alt={`${oil.name} fragrance scene`}
/>
```

---

## API Reference

### GET /api/media

List media assets. Query params: `bucket`, `category`, `linked_entity_type`, `linked_entity_id`, `search`, `tags`, `limit`, `offset`.

**Response**: `{ assets: MediaAsset[], count: number }` – assets include `thumbnail_url`, `medium_url` when applicable.

### GET /api/media/[id]/image

Redirects to transformed image. Query: `preset` = `thumbnail` | `medium` | `full`.

**Auth**: Supabase session.

### GET /api/media/[id]/file

Redirects to signed URL for private bucket files. Valid for 1 hour.

**Auth**: Supabase session. User must own the asset.

### GET /api/assets

Unified asset registry. Query: `source` = `media` | `fragrance` | `all`, `limit` (default 50).

### POST /api/images/generate

Generate AI image. Body: `prompt`, `referenceImageUrl?`, `fragranceId?`, `fragranceName?`, `model?`, `size?`, `quality?`.

**Response**: `{ asset, publicUrl }` – asset includes `thumbnail_url`, `medium_url`.

### POST /api/images/upload-from-url

Store image from URL. Body: `url`, `userId`, `bucket?`, `tags?`, `linkedEntityType?`, `linkedEntityId?`, `category?`, `fileName?`.

**Auth**: `x-api-key: MEDIA_API_KEY`.

### POST /api/notion/update-image

Update Notion page image URL. Body: `notionPageId`, `imageUrl`.

**Auth**: Supabase session or `x-api-key: MEDIA_API_KEY`.

---

## Programmatic URL Building

### Server-Side (with Supabase client)

```ts
import {
  getPublicUrl,
  getThumbnailUrl,
  getMediumUrl,
} from "@/lib/supabase/storage"

// Full URL
const url = getPublicUrl(supabase, "ai-generations", path)

// Thumbnail (300px, WebP)
const thumb = getThumbnailUrl(supabase, "ai-generations", path)

// Medium (800px, WebP)
const thumb = getMediumUrl(supabase, "ai-generations", path)

// Custom transform
const url = getPublicUrl(supabase, "ai-generations", path, {
  width: 400,
  height: 400,
  quality: 90,
  format: "webp",
  resize: "cover",
})
```

### Client-Side (URL only)

```ts
import { getTransformedUrl, getAssetUrl } from "@/lib/asset-url"

// From public URL
const thumb = getTransformedUrl(publicUrl, "thumbnail")

// From asset
const thumb = getAssetUrl(asset, "thumbnail")
```

---

## Private Files

For files in `private-documents`:

1. **Do not use**: `public_url` – it will not work for private buckets.
2. **Use**: `/api/media/[id]/file` – requires auth, redirects to a signed URL for 1 hour.

```tsx
<a href={`/api/media/${asset.id}/file`} target="_blank" rel="noopener noreferrer">
  Download
</a>
```

Or fetch the signed URL server-side with `getSignedUrl()` from `@/lib/supabase/storage`.

---

## External Workflows (n8n)

See [N8N-IMAGE-WORKFLOW.md](./N8N-IMAGE-WORKFLOW.md) for full setup.

**Quick setup**:

1. Set `MEDIA_API_KEY` in Vercel and n8n.
2. Use `x-api-key: {{$env.MEDIA_API_KEY}}` in HTTP headers.
3. Endpoints:
   - `POST /api/images/generate` – create AI image
   - `POST /api/images/upload-from-url` – store image from URL
   - `POST /api/notion/update-image` – sync to Notion

---

## Copy URL and Notion Sync

### Copy URL

- **Full URL**: Use `asset.public_url` for sharing or embedding.
- **Transformed**: Use `asset.thumbnail_url` or `asset.medium_url` if you need a smaller size.

### Sync to Notion

1. In Media Library, select an asset and assign it to a fragrance.
2. Click **Sync to Notion** – sends `public_url` to the Notion fragrance page.
3. Uses `POST /api/notion/update-image` with `notionPageId` and `imageUrl`.

---

## Troubleshooting

### Images not loading

- **Check Supabase plan**: Image transforms require Pro. On Free tier, `thumbnail_url` or `medium_url` may fail.
- **Fallback**: Use `public_url` if transforms fail. Code already falls back: `asset.thumbnail_url ?? asset.public_url`.

### Upload fails

- **Size**: Check bucket `maxSizeMB` (e.g. product-images: 10 MB).
- **Type**: Check `acceptedTypes` for the bucket.
- **Auth**: Ensure user is logged in (Supabase session).

### upload-from-url returns 401

- Set `MEDIA_API_KEY` in Vercel and pass it in `x-api-key` header.
- Legacy: `CDN_API_KEY` is still supported.

### Private file returns 403

- User must own the asset (`user_id` in `media_assets`).
- Ensure the asset is in a private bucket (`private-documents`).

### Next.js Image not optimizing

- Check `next.config.mjs`: `loader: "custom"`, `loaderFile: "./lib/supabase-image-loader.ts"`.
- Ensure `NEXT_PUBLIC_SUPABASE_URL` is set.
- `remotePatterns` must include `**.supabase.co` for both object and render paths.

### Shopify product images

- Use `cdn.shopify.com` or `**.myshopify.com` URLs directly.
- `next.config` remotePatterns include these; `next/image` can use them.
