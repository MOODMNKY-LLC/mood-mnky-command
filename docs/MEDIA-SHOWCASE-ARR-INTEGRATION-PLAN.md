# Media Showcase: *arr Stack and Integration Plan

This document summarizes research themes for a comprehensive media showcase, provides a phased integration plan, and lists environment variable placeholders for optional services (Lidarr, Navidrome, Calibre, and related *arr stack). It is intended to be refined by running the full Deep Research Protocol (`.cursor/rules/deep-thinking.mdc`) when deeper investigation is needed.

---

## Summary (report narrative)

**Knowledge development.** The media stack (Jellyfin, Lidarr, Navidrome, Calibre, *arr) serves two distinct needs: a **unified display** for the public (what we show on /main/media) and **back-office or pipeline** visibility (what is being managed, requested, or downloaded). Jellyfin acts as the natural aggregator for movies, series, and books—and optionally music—so the Main Media page can rely on Jellyfin for featured content without calling Sonarr, Radarr, or Lidarr directly. Lidarr and Navidrome are music-focused; if Jellyfin already exposes a music library fed by one of them, a separate “Official music library” API call may be redundant for the showcase. Calibre excels at ebook management; Jellyfin’s Bookshelf plugin can host books, so a single Books section from Jellyfin keeps the architecture simple unless the primary book catalog lives only in Calibre.

**Practical implications.** Phase 1 (implemented) uses Jellyfin for Featured and Books and Supabase for MNKY MUSIK and the art gallery. Phase 2 is optional: add Lidarr or Navidrome only if a distinct “full music catalog” or “recently added” block is desired; add Calibre only if books are primarily in Calibre and not in Jellyfin. *arr APIs (Sonarr, Radarr, Jellyseerr, Prowlarr, Jackett, qBittorrent) are best used in back-office or admin views (e.g. Platform → Services), not on the public Media page. Env placeholders below allow wiring these services when credentials are available and product needs justify the integration.

---

## 1. Research themes (for deep-thinking protocol)

When running the protocol, the following themes should be investigated:

1. **Jellyfin as aggregator vs direct *arr APIs**  
   When to surface Jellyfin only vs Sonarr/Radarr/Lidarr/Calibre APIs for display; how Jellyseerr/Prowlarr/Jackett fit (request vs discovery vs indexing). Jellyfin can aggregate content that *arr apps manage; for a public “showcase” page, Jellyfin is often the single front (movies, series, books, and optionally music). *arr APIs are better for back-office “what’s in the pipeline” or “recently added” admin views.

2. **Lidarr, Navidrome, and “official music library”**  
   Lidarr (X-Api-Key header, same pattern as Sonarr/Radarr) manages music; Navidrome implements the Subsonic API (token/auth, getAlbumList, getRandomSongs, getCoverArt). Overlap with Jellyfin music libraries: if Jellyfin is already fed by Lidarr or Navidrome, the Main Media page may not need to call them directly. A separate “Official music library” or “Full catalog” section could call Lidarr/Navidrome for richer metadata or “recent adds” if desired.

3. **Calibre and book display**  
   Calibre Content Server (e.g. port 8080) exposes libraries for browsing; OPDS support exists in the ecosystem. Jellyfin can host books (with the Bookshelf plugin); if books are in Jellyfin, a single Books section (as implemented) suffices. Calibre integration would be for “reading list” or “library sync” if books are primarily in Calibre.

4. **API shapes and credentials**  
   - **Prowlarr / Sonarr / Radarr / Lidarr:** REST APIs with `X-Api-Key` header; base URL + API key.  
   - **Jellyseerr:** Request management; API key; often used to drive Sonarr/Radarr.  
   - **Jackett:** Indexer proxy; API key; used by *arr apps, not typically for front-end display.  
   - **qBittorrent:** Web API; session cookie or username/password; for download status, not content display.  
   - **Navidrome:** Subsonic API; username + token or password auth; `getAlbumList`, `getRandomSongs`, `getCoverArt`, etc.  
   - **Calibre:** Content server; optional username/password; browse/download; no standard REST API like *arr.

5. **Comprehensive media showcase UX**  
   One Media page can show: MNKY MUSIK (Supabase), Featured movies/series (Jellyfin), Books (Jellyfin), Art gallery (Supabase). Optional future: “Official music library” (Lidarr/Navidrome) and “Reading list” (Calibre) as separate sections or links, without cluttering the main showcase.

---

## 2. Phased integration plan

### Phase 1 (implemented)

- **Jellyfin:** Movies, series, and books on the Main Media page via existing Jellyfin API (getJellyfinFeaturedItems, getJellyfinFeaturedBooks). Single front for video and books.
- **MNKY MUSIK:** In-app music from Supabase (verse_music_playlist + media_assets) with album art and metadata in a card gallery.
- **Art gallery:** Random gallery with AI descriptions from main_media_gallery.
- **No *arr/Lidarr/Navidrome/Calibre** in the public UI.

### Phase 2 (optional, when credentials and product need exist)

- **Lidarr:** Optional “Official music library” or “Recently added music” block. Env: `LIDARR_URL`, `LIDARR_API_KEY`. Use REST API with `X-Api-Key`; endpoints such as `/api/v1/album` or equivalent for library listing (see Lidarr API docs).
- **Navidrome:** Optional “Stream from our library” or “Random picks” using Subsonic API. Env: `NAVIDROME_URL`, `NAVIDROME_USER`, `NAVIDROME_TOKEN` (or password). Endpoints: `getAlbumList`, `getRandomSongs`, `getCoverArt`.
- **Calibre:** Optional “Reading list” or link to Calibre content server. Env: `CALIBRE_SERVER_URL`, `CALIBRE_USER`, `CALIBRE_PASSWORD` (if required). No standard REST API; browser or OPDS feed link.
- **Sonarr / Radarr / Jellyseerr:** Primarily back-office (e.g. Platform → Services or a dedicated “Media pipeline” view). Not required for the public Media showcase page. Env placeholders below for consistency.

---

## 3. Credentials database (Notion) check

The **MOOD MNKY Credentials** database in Notion ([Credentials](https://www.notion.so/mood-mnky/Credentials-95da498bdc724b4190fe67dcd61e23de)) was searched for env variables needed for the media showcase and *arr integration. **Only Jellyfin** has credential entries there (e.g. Key Code / API key for MOOD MNKY COMMAND). The following were **not found** and are omitted for sourcing from Notion: Lidarr, Navidrome, Calibre, Sonarr, Radarr, Jellyseerr, Prowlarr, Jackett, qBittorrent. Those can be added to the Credentials database and to `.env` when you introduce Phase 2 or back-office integrations.

---

## 4. Environment variable placeholders

**From Credentials DB:** Jellyfin only (use existing `JELLYFIN_BASE_URL`, `JELLYFIN_API_KEY`, `JELLYFIN_USER_ID` from Notion / env as already configured).

Add the following to `.env.example` or env docs only when you are ready to wire Phase 2 or back-office integrations. **Do not commit real keys.** These are optional; none except Jellyfin are present in the Notion Credentials database as of the last check.

```bash
# ---------------------------------------------------------------------------
# Media showcase – optional Phase 2 and back-office (others not in Credentials DB)
# ---------------------------------------------------------------------------

# Jellyfin (already used; credentials in Notion "MOOD MNKY Credentials")
# JELLYFIN_BASE_URL=
# JELLYFIN_API_KEY=
# JELLYFIN_USER_ID=

# Lidarr – music library (optional “Official music” section) – omit until in Credentials
# LIDARR_URL=
# LIDARR_API_KEY=

# Navidrome – Subsonic-compatible music server (optional) – omit until in Credentials
# NAVIDROME_URL=
# NAVIDROME_USER=
# NAVIDROME_TOKEN=

# Calibre – content server (optional “Reading list” link) – omit until in Credentials
# CALIBRE_SERVER_URL=
# CALIBRE_USER=
# CALIBRE_PASSWORD=

# Sonarr / Radarr / Jellyseerr – back-office (optional) – omit until in Credentials
# SONARR_URL=
# SONARR_API_KEY=
# RADARR_URL=
# RADARR_API_KEY=
# JELLYSEERR_URL=
# JELLYSEERR_API_KEY=

# Prowlarr / Jackett – indexers (used by *arr apps; not for showcase UI)
# PROWLARR_URL=
# PROWLARR_API_KEY=
# JACKETT_URL=
# JACKETT_API_KEY=

# qBittorrent – download client (optional) – omit until in Credentials
# QBITTORRENT_URL=
# QBITTORRENT_USER=
# QBITTORRENT_PASSWORD=
```

---

## 5. Jellyfin books note

Jellyfin supports books when the **Bookshelf** plugin is enabled and a books library is configured. The Main Media page uses `IncludeItemTypes=Book` and Primary image for cover. If no books appear, ensure the Jellyfin server has a books library and the plugin is enabled.

---

## 6. References

- Jellyfin: [Books | Jellyfin](https://jellyfin.org/docs/general/server/media/books)
- Navidrome: [Subsonic API Compatibility](https://navidrome.org/docs/developers/subsonic-api)
- Sonarr/Radarr/Lidarr: `X-Api-Key` header; API docs per project (e.g. Sonarr at sonarr.tv/docs/api)
- Calibre: [The calibre Content server](https://manual.calibre-ebook.com/server.html)

This plan keeps the Media section as a single, cohesive showcase in Phase 1 and documents a path for optional expansion without blocking the current implementation.
