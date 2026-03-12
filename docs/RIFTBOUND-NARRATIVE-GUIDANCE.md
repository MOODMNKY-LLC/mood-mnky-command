# Riftbound Narrative and Copy Guidance

This doc guides authoring and syncing the **RIFTBOUND — The Sensory Atlas** narrative (and any story-driven manga collection). It aligns with [temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md](../temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md) and the manga engine in [PRD-Collection-Manga-Magazine.md](PRD-Collection-Manga-Magazine.md).

---

## Where to author

- **Notion:** Use **MNKY Manga Collections** and **MNKY Manga Issues** (and optional Chapters/Panels/Hotspots DBs) for structured content. Sync to Supabase via `POST /api/notion/sync/manga` (see [Notion sync](#notion-sync)).
- **Repo:** Use this doc and the starter doc for outlines and copy templates; store final narrative text in Notion or in `docs/` / `temp/` as needed.

---

## Deliverables checklist

### 1. Collection and product copy (Shopify)

- **Collection description (Shopify):** Short intro for the collection (e.g. RIFTBOUND) on the Shopify collection page. Example tone: “When reality fractures, MOOD MNKY stabilizes rifts and distills them into signature scent blends. This collection takes you through six rifts…”
- **Per-product “Chapter” sections:** For each fragrance product, add a “Chapter” block: title/tagline (e.g. “Rift of Indulgence – The Alley That Remembers Your Name”), short lore summary, key notes, CTA (“Unlock this chapter in the manga and earn Rift Shards”). Store in Shopify metafields or metaobjects and reference from the theme.
- **Cross-links:** Link to the digital issue product (e.g. RIFTBOUND digital magazine) so customers can redeem or purchase the issue.

### 2. Full issue storyboard outline

- **Arc summary:** One short synopsis for the issue (e.g. Volume I), covering the six rifts and the cliffhanger of the seventh. Goes in `arc_summary` (Notion / Supabase `mnky_issues`).
- **Chapter outline (per rift/chapter):**
  - Setting & mood (location, “glitch” logic).
  - Narrative beats (events in order; each beat can map to one or more panels).
  - Panel prompts: high-level art prompt per beat (for Flowise or image gen); map to `asset_prompt` / `script_text`.
  - Hotspots: which panels link to the fragrance product; approximate x/y and tooltip (e.g. “Indulgence Essence”).
  - Glitch cut: where the story transitions to the next chapter or a machine interlude.
- **Machine interludes:** Short meta-panels between chapters (Rift Engine, shadow antagonist, MOOD MNKY decoding messages) to drive meta-plot and set up Volume II.
- **Quiz and download:** Per chapter, suggest a few quiz questions and an optional download (e.g. printable “Fragrance Card”). Use [Flowise quiz-generator tool](COMPANION-MANGA-ROADMAP.md) and [MAG-XP-RULES](MAG-XP-RULES.md) (mag_quiz, mag_download).

---

## Notion sync

- Ensure **NOTION_MNKY_COLLECTIONS_DATABASE_ID** and **NOTION_MNKY_ISSUES_DATABASE_ID** are set in `.env`. Optional: chapters, panels, hotspots DB IDs.
- Trigger sync (admin or `MOODMNKY_API_KEY`): `POST /api/notion/sync/manga` with body as required by the route (see [app/api/notion/sync/manga/route.ts](../app/api/notion/sync/manga/route.ts)).
- After sync, publish to Shopify metaobjects if needed: `POST /api/shopify/sync/metaobject-manga` (see [SHOPIFY-MANGA-METAOBJECTS.md](SHOPIFY-MANGA-METAOBJECTS.md)).

---

## Flowise tools for content

- **lore/get-issue-context:** Returns issue, chapters, panels for a given `issueSlug`. Use in chatflows when generating or refining narrative.
- **manga/hotspot-mapper:** Returns issue, chapters, panels, and existing hotspots; use LLM in Flowise to suggest new hotspots from script/asset_prompt.
- **manga/quiz-generator:** Returns issue, chapters, and pass_threshold; use LLM to generate quiz questions from arc/chapters.

---

## Related

- [COMPANION-MANGA-ROADMAP.md](COMPANION-MANGA-ROADMAP.md) — Phases and references.
- [temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md](../temp/MNKY-COMPANION-MANGA-ENGINE-STARTER.md) — Full Riftbound plan and metaobject schema.
