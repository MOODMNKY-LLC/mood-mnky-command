# Asset and CDN Architecture

This document describes how digital assets flow through MOOD MNKY LABZ: sources, storage, delivery, and optimization.

## Overview

The app uses **Supabase Storage** as the primary asset store with built-in CDN. There is no separate CDN layer. Image optimization uses Supabase's image transformation (Pro plan) and Next.js custom loader.

## Data Flow

```
Sources                    Storage                     Delivery
────────                   ───────                     ────────
Browser Upload     ──►     Supabase Storage    ──►     public_url
AI Generate        ──►     (buckets)           ──►     thumbnail_url
Upload from URL    ──►                         ──►     medium_url
                                                    ──► /api/media/[id]/image
                                                    ──► /api/media/[id]/file
Shopify Products   ──►     Shopify CDN         ──►     (external)
Static icons       ──►     /public             ──►     Next.js/Vercel
```

## Buckets

| Bucket | Purpose | Public | Transform |
|--------|---------|--------|-----------|
| product-images | Product photos for Shopify | Yes | Yes |
| ai-generations | AI-generated fragrance scenes | Yes | Yes |
| brand-assets | Logos, mascots, videos, PDFs | Yes | Yes |
| user-avatars | Profile pictures | Yes | Yes |
| private-documents | Internal documents | No | - |

## Transform Presets

| Preset | Size | Use Case |
|--------|------|----------|
| thumbnail | 300px, WebP 80% | Grids, list thumbnails |
| medium | 800px, WebP 85% | Detail views, previews |
| full | Original | Copy URL, Notion sync |

## API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/media` | List media assets (enriched with thumbnail_url, medium_url) |
| `GET /api/media/[id]/image?preset=thumbnail` | Redirect to transformed image |
| `GET /api/media/[id]/file` | Redirect to signed URL for private files |
| `GET /api/assets?source=media|fragrance|all` | Unified asset registry |

## URL Patterns

- **Raw public URL**: `https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}`
- **Transformed URL**: `https://{project}.supabase.co/storage/v1/render/image/public/{bucket}/{path}?width=300&quality=80&format=webp`
- **Image proxy**: `/api/media/{id}/image?preset=thumbnail` → redirects to transformed URL
- **Private proxy**: `/api/media/{id}/file` → redirects to signed URL (1h expiry)

## Usage

### In Components

Use `thumbnail_url` or `medium_url` from API when available; fall back to `public_url`:

```tsx
<img src={asset.thumbnail_url ?? asset.public_url} alt={asset.file_name} />
```

### Unified Builder

```ts
import { getAssetUrl } from "@/lib/asset-url"

const url = getAssetUrl(asset, "thumbnail")
```

### Next.js Image

With the custom loader, `next/image` works with Supabase URLs and applies transforms:

```tsx
import Image from "next/image"

<Image src={asset.public_url} width={300} height={300} alt="..." />
```

## Cache Strategy

- Supabase Storage uses Smart CDN; cache invalidates within ~60s on update/delete
- Upload uses `cacheControl: "3600"` (1 hour)
- For long-lived static assets, consider higher values

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (used by loader) |
| `MEDIA_API_KEY` | API auth for n8n workflows (upload-from-url, update-image) |

## Limitations

- Image transformation requires Supabase Pro plan
- Shopify product images use Shopify CDN (added to remotePatterns)
- Private documents: use `/api/media/[id]/file` for secure access
