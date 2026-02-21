# Notion ↔ Manga 2-Way Sync (Supabase)

## Overview

- **Pull (Notion → Supabase):** Existing one-way sync. Trigger: Verse Backoffice “Sync from Notion” or `POST /api/notion/sync/manga`. Overwrites/upserts by `notion_id`.
- **Push (Supabase → Notion):** When you upload a cover or panel image in LABZ (or later, when you edit issue/collection metadata in LABZ), we push the new values to the corresponding Notion page when the row has a `notion_id`.

## When we push

- **After cover upload:** `POST /api/verse-backoffice/manga/upload-cover` updates `mnky_issues.cover_asset_url` and, if `mnky_issues.notion_id` is set, calls Notion API to set the issue page’s **Cover URL** property.
- **After panel image upload:** `POST /api/verse-backoffice/manga/upload-panel` updates `mnky_panels.asset_url` and, if `mnky_panels.notion_id` is set, sets the panel page’s **Asset URL** property in Notion.
- **After issue metadata edit:** Saving the issue form on the issue detail page (`/verse-backoffice/manga/[slug]`) PATCHes `mnky_issues` and, when `notion_id` is set, pushes Title, Slug, Status, Arc Summary, Published Date, and Collection (relation) to the Notion issue page.
- **After collection metadata edit:** Saving the collection form on the collection detail page (`/verse-backoffice/manga/collections/[id]`) PATCHes `mnky_collections` and, when `notion_id` is set, pushes Name and Slug to the Notion collection page.
- **Metadata-only push API:** `POST /api/notion/sync/manga/push` with body `{ type: "issue" | "collection", id: "<uuid>" }` (Supabase row id). Loads the row, builds the Notion property payload, and PATCHes the linked Notion page. Use to re-push after a manual DB edit or to sync metadata without re-saving in LABZ. Requires manga admin auth (MOODMNKY_API_KEY or admin session).

## Conflict strategy

- **Last write wins** per field. LABZ uploads and edits are the source of truth for URLs and metadata edited in LABZ; “Sync from Notion” remains the source when pulling from Notion.
- **Push only immediately after a LABZ action** (e.g. right after upload or save), not on a timer. This avoids overwriting Notion with stale Supabase data.

## Notion database reference

| Database              | Database ID (env / reference) | Relevant properties for push        |
|-----------------------|--------------------------------|--------------------------------------|
| MNKY Manga Collections | `NOTION_MNKY_COLLECTIONS_DATABASE_ID` (`fc437b6b-1fae-42fd-a98b-20b08ed12716`) | Name, Slug                           |
| MNKY Manga Issues     | `NOTION_MNKY_ISSUES_DATABASE_ID` (`f9110e0c-667a-4b0e-9497-ee7b8dd6b124`)     | Title, Slug, Cover URL, Arc Summary, Status, Published Date, Collection |
| MNKY Manga Panels     | `NOTION_MNKY_PANELS_DATABASE_ID` (optional)                                    | Asset URL                            |

Implementation: `apps/web/lib/notion.ts` (push helpers for cover, panel, issue metadata, collection metadata), upload routes in `apps/web/app/api/verse-backoffice/manga/`, PATCH routes `.../manga/issues/[id]` and `.../manga/collections/[id]`, and `apps/web/app/api/notion/sync/manga/push/route.ts` for the metadata-only push API.
