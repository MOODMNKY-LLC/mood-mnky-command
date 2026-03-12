# PRD: Collection Manga / Magazine

## Overview and objectives

The Collection Manga (Magazine) engine is a per-collection narrative and commerce format. Each collection (e.g. World Traveler Series) has one or more “issues.” Each issue is a cohesive story (e.g. “Passport of the Senses”) with chapters that map to fragrances, storyboard panels, and shoppable hotspots. Reading, downloading, and passing quizzes generate telemetry and can award XP in the gamification system. The system is template-driven so every new collection can be produced consistently. Content is authored in Notion (optional) and synced to Supabase; the canonical store is Supabase; a publish pipeline can push a snapshot to Shopify metaobjects for theme/Storefront API consumption.

## Target audience

- **Primary:** Shoppers and readers who discover collections on the store or Verse and want an immersive, story-led experience with optional shopping via hotspots.
- **Secondary:** Content and merchandising operators who create issues (in Notion or LABZ), manage panels and hotspots, and publish to the storefront.

## Core features and functionality

- **Collections and issues:** `mnky_collections` (name, slug, shopify_collection_gid); `mnky_issues` (collection_id, issue_number, title, slug, status draft|published, arc_summary, cover_asset_url, published_at).
- **Chapters and panels:** Each issue has `mnky_chapters` (one per fragrance: fragrance_name, shopify_product_gid, setting, chapter_order). Each chapter has `mnky_panels` (panel_number, script_text, asset_prompt, asset_url). Panels are ordered; script and asset support storyboard and final art.
- **Hotspots:** `mnky_hotspots` (panel_id, type product|variant|collection|bundle, shopify_gid, x/y in 0..1, label, tooltip). Hotspots are “lore-first” artifacts that link to Shopify products/collections.
- **Telemetry and XP:** `mnky_read_events` (profile_id, issue_id, chapter_id, session_id, percent_read, active_seconds, completed). Read XP is granted when percent_read ≥ 80% and active_seconds ≥ 90, once per issue per season (when seasons are used). `mnky_download_events` (profile_id, issue_id, download_type: pdf|wallpaper_pack|scent_cards) with unique (profile_id, issue_id, download_type). `mnky_quiz_attempts` (profile_id, issue_id, score, passed). Quiz and download XP rules are configurable (e.g. pass threshold, cooldown).
- **Verse reader:** Public routes `/verse/issues`, `/verse/issues/[slug]`, `/verse/issues/[slug]/chapters/[n]` render issues and chapters. The chapter reader sends read telemetry to `POST /api/mag/read-event` and enforces completion rules before XP is awarded (handled by backend or Inngest).
- **Backoffice:** Verse Backoffice → Manga/Issues lists issues and allows navigation to issue detail and chapter/panel structure. New issue creation can be via Notion sync or a future create form.

Acceptance criteria: “Published issues appear on /verse/issues”; “Chapter page shows panels and hotspots; scrolling and time are tracked and sent to read-event”; “Download and quiz submit are recorded and respect uniqueness/cooldowns.”

## Technical stack recommendations

- **Backend:** Next.js, Supabase. Optional: Notion as authoring source with sync job to Supabase.
- **Flowise/OpenAI:** Flowise (Editorial Director, Hotspot Mapper, Quiz Generator) produces structured output; tool façade endpoints (e.g. `/api/flowise/tools/lore/get-issue-context`, `shopify/resolve-product`) are called by Flowise with `MOODMNKY_API_KEY`. OpenAI direct for moderation and optional embeddings.
- **Rendering:** Next.js Server Components for issue/chapter pages; client component for scroll-based read telemetry and hotspot interactions.

## Conceptual data model

- **mnky_collections:** id, name, slug, shopify_collection_gid, created_at.
- **mnky_issues:** id, collection_id, issue_number, title, slug, status, arc_summary, cover_asset_url, published_at, created_at.
- **mnky_chapters:** id, issue_id, fragrance_name, shopify_product_gid, setting, chapter_order, created_at.
- **mnky_panels:** id, chapter_id, panel_number, script_text, asset_prompt, asset_url, created_at; unique (chapter_id, panel_number).
- **mnky_hotspots:** id, panel_id, type, shopify_gid, x, y, label, tooltip.
- **mnky_read_events,** **mnky_download_events,** **mnky_quiz_attempts:** as above.

All telemetry tables reference `profiles(id)` and the relevant issue/chapter for scoping and XP rules.

## UI design principles

- **Reader:** Full-bleed or contained panel layout; hotspots as subtle overlays (e.g. “+” or icon) that open product or collection. No hard “buy now” feel; “collect this artifact” tone.
- **Backoffice:** List → detail → chapters/panels; optional Notion sync trigger; preview link to draft route.

## Security considerations

- Issue/chapter/panel data for published issues is readable by anon for storefront; draft content is restricted to authenticated admin. RLS enforces this.
- Read/download/quiz endpoints require authenticated user (Supabase session) where XP or state is updated. Telemetry is validated (zod) and rate-limited where appropriate.

## Development phases / milestones

- **Phase 1 (done):** Supabase schema (collections, issues, chapters, panels, hotspots, read/download/quiz events); Core API (read-event, download, quiz/submit, issues list, issue by slug, chapters by slug).
- **Phase 2 (done):** Verse routes and chapter reader component with read telemetry and hotspots; optional quiz and download flows wired to APIs.
- **Phase 3 (done):** Theme block (Issue Teaser), App Proxy for session and api/issues; documentation for metaobject publish.
- **Phase 4 (done):** Read/quiz/download XP via Inngest (mag/read.completed, mag/quiz.passed, mag/download.recorded); hotspot links resolve shopify_gid to product/collection URLs; rate limiting (Upstash) on mag/ugc endpoints; config_xp_rules seeding (see [MAG-XP-RULES.md](MAG-XP-RULES.md)); Notion sync job (MNKY_Collections, MNKY_Issues, MNKY_Chapters, MNKY_Panels, MNKY_Hotspots) with auth (MOODMNKY_API_KEY or admin); Flowise tools (lore/get-issue-context, shopify/resolve-product); quest evaluation triggered on mag and UGC events.
- **Future:** Flowise storyboard generation and hotspot mapping; PDF export and signed download URLs; metaobject definitions and publish-from-backoffice flow; quiz builder and question pools in backoffice.

## Potential challenges and solutions

- **Scale:** Large numbers of panels per issue; use pagination or virtualized list if needed; assets in Supabase Storage or CDN.
- **Consistency:** Storyboard template (e.g. 10 panels per chapter) and Notion schema keep production predictable. Flowise outputs validated with zod before write.

## Future expansion possibilities

- Multiple issues per collection; issue numbering and “current issue” per collection.
- Ambient audio per chapter (howler); richer scroll-driven animations (react-scrollama / intersection observer).
- Localization of issues; A/B tests on hotspot placement; analytics on read depth and conversion.
