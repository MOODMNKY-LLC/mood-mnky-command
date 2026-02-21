# LABZ Platform Storage (MinIO/S3 Control Panel)

The LABZ platform includes a MinIO/S3 storage control panel at `/platform/storage` for admins to manage buckets and objects directly.

## Environment Variables

These must be set in the app `.env` (or `.env.local`) for the storage panel to work:

| Variable | Purpose |
|----------|---------|
| `S3_ENDPOINT_URL` | MinIO/S3 API endpoint (e.g. `https://s3-api-data.moodmnky.com`) |
| `S3_STORAGE_ACCESS_KEY_ID` | Access key |
| `S3_STORAGE_SECRET_ACCESS_KEY` | Secret key |
| `S3_STORAGE_REGION` | Region (e.g. `us-east-1`) |
| `S3_STORAGE_BUCKET_NAME` | Default bucket when ListBuckets is unavailable (e.g. `flowise-dev`) |
| `S3_FORCE_PATH_STYLE` | `true` for MinIO |

## Credential Behavior

Current credentials may have read/write on specific buckets (e.g. `flowise-dev`) but lack:

- **`s3:ListAllMyBuckets`** — ListBuckets will fail; UI shows "Add admin credentials for bucket list" and allows manual bucket entry
- **`s3:CreateBucket`** — CreateBucket will fail; UI shows error toast

The panel tries each operation and surfaces clear errors. If ListBuckets succeeds, a bucket picker is shown; otherwise it defaults to `S3_STORAGE_BUCKET_NAME` (flowise-dev).

## API Overview

All routes require admin authentication (`profile.role === "admin"` or `profile.is_admin === true`).

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/platform/storage/buckets` | GET | List buckets (returns `{ buckets, error? }` on permission failure) |
| `/api/platform/storage/buckets` | POST | Create bucket (body: `{ name }`) |
| `/api/platform/storage/buckets/[bucket]/objects` | GET | List objects (query: `?prefix=`) |
| `/api/platform/storage/buckets/[bucket]/objects` | POST | Upload object (multipart/form-data: `file`, optional `key`) |
| `/api/platform/storage/buckets/[bucket]/objects` | DELETE | Delete objects (body: `{ keys: string[] }`) |
| `/api/platform/storage/buckets/[bucket]/objects/signed-url` | POST | Get signed URL (body: `{ key, expiresIn? }`) |

## Architecture

- **S3 client**: `apps/web/lib/minio/s3-client.ts` — uses `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` with custom endpoint for MinIO
- **API routes**: `apps/web/app/api/platform/storage/`
- **UI**: `apps/web/app/(dashboard)/platform/storage/page.tsx`

## Features

- **Buckets tab**: List buckets (or manual entry if ListBuckets fails), create bucket
- **Objects tab**: Breadcrumb navigation, folder/object table, upload, delete selected, refresh, copy signed URL to clipboard
