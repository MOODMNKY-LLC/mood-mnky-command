# Production Theme Review (after pull)

**Pulled:** Live theme "MNKY VERSE Theme" (#180115833106) from `mood-mnky-3.myshopify.com` via `shopify theme pull --path Shopify/theme --store mood-mnky-3.myshopify.com --live`.

---

## 1. What was verified

### URLs

- **index.json:** Slide 2 "Enter the MNKY VERSE" uses `https://mnky-command.moodmnky.com/verse`. All app blocks use `app_base_url: "https://mnky-command.moodmnky.com"`.
- **featured-blog:** `verse_blog_url` is `https://mnky-command.moodmnky.com/verse/blog`.
- **blog.json:** Verse blog CTA link is `https://mnky-command.moodmnky.com/verse/blog`.
- **footer-group.json:** MNKY VERSE blog link is `https://mnky-command.moodmnky.com/verse/blog`.
- **config/settings_data.json:** MNKY Assistant embed has `app_base_url: "https://mnky-command.moodmnky.com"`.

No `app.moodmnky.com` references remain in the pulled theme; canonical base is correct.

### App blocks and sections

- **Three Apps sections** exist with blocks split as intended:
  - `1771436989adce6292`: Blending Lab CTA + Match My Mood CTA (2 blocks).
  - `177143917427cd49b1`: Latest from MNKY VERSE (1 block).
  - `17714395739f3edb21`: Subscription CTA (1 block).
- **app-cta-0:** Standalone Blending Lab section still present; it duplicates the Blending Lab CTA in the first Apps section.

### Section order (current)

1. slideshow  
2. multicolumn-0 (Why MOOD MNKY)  
3. featured-collection-0 (Sensory Journeys)  
4. **app-cta-0** (Blending Lab standalone)  
5. **1771436989adce6292** (Apps: Blending + Match My Mood)  
6. featured-blog (Stories from the MNKY VERSE)  
7. **177143917427cd49b1** (Apps: Latest from MNKY VERSE)  
8. image-with-text-0..3 (disabled)  
9. featured-collection-1 (disabled)  
10. rich-text (disabled)  
11. multicolumn-1 (disabled)  
12. **a4b1732b** (Subscribe to the Vibe collection)  
13. **17714395739f3edb21** (Apps: Subscription CTA)  
14. newsletter  

---

## 2. Edits applied in repo

| File | Change |
|------|--------|
| **sections/apps.liquid** | Re-applied Layout option (Stacked / 2 columns / 4 columns) and grid wrapper; production had no layout setting, so blocks always stacked. Merchants can now choose 2-col or 4-col on desktop in Theme Editor. |
| **sections/app-cta.liquid** | Schema `info` and `placeholder` for App base URL updated from `app.moodmnky.com` to `mnky-command.moodmnky.com`. |
| **sections/featured-blog.liquid** | Schema `info` for Verse blog URL updated from `app.moodmnky.com` to `mnky-command.moodmnky.com`. |

---

## 3. Suggested theme editor changes (optional)

- **Remove duplicate Blending Lab:** Disable or remove **app-cta-0** so Blending Lab appears only in the first Apps section. Or keep it if you want a full-width hero-style CTA there.
- **Section order (UI/UX):** For a clearer flow (experience → subscribe → stories → newsletter), consider in Theme Editor:
  - Moving **Subscribe to the Vibe** (a4b1732b) and **Subscription CTA Apps** (17714395739f3edb21) earlier, e.g. after the first Apps section (1771436989adce6292) and before featured-blog.
  - Resulting order could be: slideshow → Why MOOD MNKY → Sensory Journeys → Apps (Blending + Match My Mood) → Subscribe to the Vibe collection → Apps (Subscription CTA) → [optional app-cta-0 or remove] → Featured blog → Apps (Latest from VERSE) → newsletter.
- **Apps section layout:** For each Apps section, in the section settings set **Layout** to "2 columns" or "4 columns" if you want blocks side-by-side on desktop.

After making any of these in the theme editor, run `shopify theme pull --path Shopify/theme --store mood-mnky-3.myshopify.com --live` again to persist changes to the repo.

---

## 4. Summary

- Production theme uses the correct app base URL everywhere.
- App blocks are already split across three Apps sections; only layout and section order were improved or suggested.
- Layout option re-added to `apps.liquid`; schema copy updated for app base URL in app-cta and featured-blog.
