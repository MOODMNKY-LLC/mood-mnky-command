# Service card assets (Main site)

Bundle/hero images for **Main → Services** cards are stored in Supabase Storage so you can update them without redeploying.

## Where to upload

1. **Supabase Dashboard** → your project → **Storage** → create or open bucket **`service-cards`**.
2. Create a folder **`bundles`** (or use the path below).
3. Upload images with these paths (recommended naming by service id):

| Service ID              | Suggested path                 |
|-------------------------|--------------------------------|
| mnky-cloud              | `bundles/mnky-cloud.png`       |
| mnky-media              | `bundles/mnky-media.png`       |
| mnky-drive              | `bundles/mnky-drive.png`       |
| mnky-auto               | `bundles/mnky-auto.png`        |
| mnky-agents             | `bundles/mnky-agents.png`      |
| mnky-games              | `bundles/mnky-games.png`       |
| mood-mnky-experience    | `bundles/mood-mnky-experience.png` |

Supported formats: JPEG, PNG, WebP, SVG. Max file size: 10 MB (bucket limit).

## Getting the public URL

After upload, use the **Public URL** from the file’s context menu in the Dashboard, or build it as:

```
https://<PROJECT_REF>.supabase.co/storage/v1/object/public/service-cards/bundles/<service-id>.<ext>
```

Example: `https://xxxx.supabase.co/storage/v1/object/public/service-cards/bundles/mnky-cloud.png`

## Using the URL in the app

Set **`bundleImageUrl`** in `apps/web/lib/main-services-data.ts` for each service that has an image, e.g.:

```ts
{
  id: "mnky-cloud",
  name: "MNKY CLOUD",
  bundleImageUrl: "https://<PROJECT_REF>.supabase.co/storage/v1/object/public/service-cards/bundles/mnky-cloud.png",
  // ...
}
```

If `bundleImageUrl` is omitted, the card uses the placeholder: `/images/services/bundle-placeholder.svg`.

## Bucket creation

The bucket is created by migration **`supabase/migrations/20260223140000_service_cards_bucket.sql`**. Run `supabase db push` (or apply migrations in the Supabase project) so the bucket and public read policy exist before uploading.

## Back office: App Assets

In **MNKY LABZ → Create & Chat → App Assets** (`/studio/app-assets`), you can browse all app-facing image slots by category (e.g. **Main → Services**), upload or replace the image for each slot, and remove it. Uploads go to the `service-cards` bucket and are linked to the slot; the Main Services page resolves images from these slots automatically. Optional: link a slot to a Notion page (`notion_page_id`) for two-way sync (push URL after upload).

## Code reference

- Bucket id: `BUCKETS.serviceCards` in `apps/web/lib/supabase/storage.ts`.
- Card component: `apps/web/components/main/main-service-card.tsx` (uses `service.bundleImageUrl` or placeholder).
- Slot resolution: `apps/web/lib/app-asset-slots.ts` (`getMainServiceImageUrls`); `app_asset_slots` table and `/api/app-assets/slots` APIs.
