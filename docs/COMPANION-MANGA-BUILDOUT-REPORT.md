# Deep Research and Companion & Manga Build-Out — Report

This report summarizes what was implemented under the **Deep Research and Companion Build-Out** plan and suggests next-phase actions.

---

## Part 1 — Research (deliverables)

| Theme | Outcome |
|-------|--------|
| **1. Shopify Admin metaobject definitions** | Official docs show `MetaobjectFieldDefinitionCreateInput` (type, key, name, etc.). The app uses `reference: { type: "mnky_collection" }` for the `mnky_issue.collection` field. A troubleshooting note was added in [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md); no code change was required. |
| **2. Flowise Custom Tool → app** | Documented in [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md) (“Calling app tools from Flowise (Manga)”) and [FLOWISE-FRAGRANCE-CRAFTING.md](FLOWISE-FRAGRANCE-CRAFTING.md): POST with `Authorization: Bearer MOODMNKY_API_KEY`, JSON body; URLs for hotspot-mapper and quiz-generator. |
| **3. Notion ↔ Supabase manga sync** | Mapping and env documented in [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md) (“Notion ↔ Supabase manga sync (mapping)”). Required: `NOTION_MNKY_COLLECTIONS_DATABASE_ID`, `NOTION_MNKY_ISSUES_DATABASE_ID`. Optional: chapters/panels/hotspots DB IDs. |
| **4. Backoffice UI and auth** | Pattern confirmed: session + `credentials: "include"`, loading, error alert, `router.refresh()` (see [manga-sync-notion-button.tsx](../components/verse-backoffice/manga-sync-notion-button.tsx)). Reused for Publish button. |
| **5. Storefront/theme** | One-paragraph recommendation in [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md): prefer Shopify metaobjects for “current issue” when possible; use App Proxy when live Supabase data or pre-publish is needed. |

---

## Part 2 — Implementation

### Core (required)

- **2.1 Metaobject definition** — No fix applied; research did not require a change. Troubleshooting note in docs.
- **2.2 Backoffice “Publish to Shopify”**
  - **Component:** [components/verse-backoffice/manga-publish-shopify-button.tsx](../components/verse-backoffice/manga-publish-shopify-button.tsx) — client component, `POST /api/shopify/sync/metaobject-manga`, `credentials: "include"`, optional `issueSlug` prop.
  - **List page:** Button added on [app/(dashboard)/verse-backoffice/manga/page.tsx](../app/(dashboard)/verse-backoffice/manga/page.tsx).
  - **Detail page:** Button with `issueSlug={slug}` on [app/(dashboard)/verse-backoffice/manga/[slug]/page.tsx](../app/(dashboard)/verse-backoffice/manga/[slug]/page.tsx).
- **2.3 Env and docs**
  - `.env.example`: `SHOPIFY_ADMIN_API_TOKEN` comment (metaobject scopes); optional `NEXT_PUBLIC_FEATURED_ISSUE_SLUG`.
  - Flowise Custom Tool note in roadmap and FLOWISE-FRAGRANCE-CRAFTING.

### Optional (2.4 & 2.5)

- **2.4 Dojo “Current issue” link**
  - Dojo home “Your space” section shows a **Current issue** link when a published issue exists.
  - Logic: first published issue (by `published_at`) or slug from `NEXT_PUBLIC_FEATURED_ISSUE_SLUG`.
  - Implemented in [app/dojo/page.tsx](../app/dojo/page.tsx) (featured issue fetch, `featuredIssue` passed to sections) and [components/dojo/dojo-home-sections.tsx](../components/dojo/dojo-home-sections.tsx) (Manga & Issues card: “Current issue: [title]” + “All issues →”).
- **2.5 Theme block “current issue”**
  - [extensions/mood-mnky-theme/blocks/mnky-verse-issue-teaser.liquid](../extensions/mood-mnky-theme/blocks/mnky-verse-issue-teaser.liquid) extended with optional **Current issue slug** and **Current issue button label** (and aria-label). When set, a “Current issue” button links to `app_base_url/verse/issues/[slug]`.
  - [MNKY-VERSE-APP-PROXY-SETUP.md](MNKY-VERSE-APP-PROXY-SETUP.md) updated to mention this option.

---

## Suggestions for next phase

1. **Manual doc tweaks (optional)**  
   If not already done, update [DOJO-SECTION.md](DOJO-SECTION.md) and [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md) “Dojo and theme (Phase 4)” to state that the Dojo Current issue link and theme block Current issue slug are implemented (in case quote-character issues prevented automated edits).

2. **Theme: metaobject-based current issue**  
   For a fully metaobject-driven “current issue” in Liquid (no slug setting), add a theme section that references the `mnky_issue` metaobject type and filters by `status = "published"` (or use Storefront API from theme JS). See [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md).

3. **Flowise**  
   Wire Custom Tool nodes for hotspot-mapper and quiz-generator in Flowise using the documented URL, method, and Bearer auth; verify with a test issue slug.

4. **Verification**  
   Run through: Notion sync → Backoffice “Publish to Shopify” (list and single-issue) → confirm metaobjects in Shopify Admin → set `NEXT_PUBLIC_FEATURED_ISSUE_SLUG` (or rely on first published) → confirm Dojo “Current issue” link and theme block “Current issue” button.

5. **Rate limiting / security**  
   Per roadmap Phase 5: consider Upstash Redis rate limits on mag read-event, quiz, UGC presign; Flowise tool endpoints remain `MOODMNKY_API_KEY`-only.

---

## Files touched (summary)

- **New:** `components/verse-backoffice/manga-publish-shopify-button.tsx`, `docs/COMPANION-MANGA-BUILDOUT-REPORT.md`
- **Updated:** `app/dojo/page.tsx`, `app/(dashboard)/verse-backoffice/manga/page.tsx`, `app/(dashboard)/verse-backoffice/manga/[slug]/page.tsx`, `components/dojo/dojo-home-sections.tsx`, `extensions/mood-mnky-theme/blocks/mnky-verse-issue-teaser.liquid`, `docs/SHOPIFY-MANGA-METAOBJECTS.md`, `docs/COMPANION-MANGA-ROADMAP.md`, `docs/FLOWISE-FRAGRANCE-CRAFTING.md`, `docs/MNKY-VERSE-APP-PROXY-SETUP.md`, `.env.example`

Plan file was not modified, as requested.
