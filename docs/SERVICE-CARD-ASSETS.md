# Service card assets (Main site)

Bundle/hero images for **Main → Services** and **Main → Community** are stored in Supabase Storage so you can update them without redeploying. **App Assets** (`/studio/app-assets`) is the single backoffice for editing and uploading all front-end image slots (Main → Services, Main → Community, and any future Main or app-wide slots).

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

## Main → Community slots

The **Community** page (`/main/community`) uses app asset slots in category `main-community`. Slot keys: `main.community.hero`, `main.community.discord`, `main.community.blog`, `main.community.dojo`. Resolver: `getMainCommunityImageUrls()` in `apps/web/lib/app-asset-slots.ts` (returns keys `hero`, `discord`, `blog`, `dojo`). Placeholders when no image: `/images/community/placeholder.svg`. Slots are seeded by migration `20260330000000_main_community_asset_slots.sql`.

## Back office: App Assets

In **MNKY LABZ → Create & Chat → App Assets** (`/studio/app-assets`), you can browse all app-facing image slots by category (**Main → Services**, **Main → Community**, etc.), upload or replace the image for each slot, and remove it. This is the single location for editing/uploading/changing all front-end images. Uploads go to the `service-cards` bucket and are linked to the slot; the Main Services and Community pages resolve images from these slots automatically. Optional: link a slot to a Notion page (`notion_page_id`) for two-way sync (push URL after upload).

## Code reference

- Bucket id: `BUCKETS.serviceCards` in `apps/web/lib/supabase/storage.ts`.
- Services: `apps/web/components/main/main-service-card.tsx` (uses `service.bundleImageUrl` or placeholder); `getMainServiceImageUrls()` in `apps/web/lib/app-asset-slots.ts`.
- Community: `apps/web/app/(main)/main/community/page.tsx` (uses `getMainCommunityImageUrls()`); placeholder `/images/community/placeholder.svg`.
- Slots: `app_asset_slots` table; APIs `/api/app-assets/slots`, `/api/app-assets/slots/[slotKey]/upload`.
