# Hydaelyn Roadmap

Phased roadmap for the FFXIV Pull Stats & Stream Command Center app.

## Phase 1 (Current)

- **Stream sessions** — Create sessions from the **Live** dashboard context; get a unique overlay token for OBS and ACT.
- **OBS overlay** — Browser source URL shows pull count and best pull on stream.
- **ACT ingest** — OverlayPlugin overlay POSTs combat data to Hydaelyn; overlay and OBS view update.
- **Discord sign-in** — Primary auth: "Sign in with Discord" (hero CTA and header).
- **Email/password** — Sign in, sign up, forgot password, update password.
- **FFLogs link & sync** — Link FFLogs account from **FFLogs** context; "My FFLogs reports" list and report viewer.
- **Dashboard contexts & team switcher** — Sidebar header team switcher toggles context: **FFLogs** (`/dashboard/fflogs`), **Live / Overlay** (`/dashboard/live`), **ACT / Raid Data** (`/dashboard/act`). Context-specific nav and content; root header hidden on dashboard so sidebar is not obscured.
- **ACT / Raid Data context** — Read-only view of `hydaelyn.encounter_table`, `combatant_table`, `current_table`; optional Realtime publication; **AI insights** per encounter via `POST /api/act/insights` (OpenAI).
- **Hydaelyn theme** — Crystal/azure primary, gold accent; light and dark mode (next-themes).
- **Lodestone character data (XIVAPI)** — Gear/job card uses our own Lodestone pipeline via XIVAPI first (`/api/lodestone/character` by name+server or lodestoneId); FFLogs `Character.gameData` used as fallback when XIVAPI is unavailable or character not found.

## Phase 2

- **Deeper FFLogs** — Report table/rankings, graph data, phases; optional normalized `user_reports` for faster lists.
- **Recaps** — Pull recaps and session summaries (from ACT ingest + FFLogs).
- **OpenAI insights** — Cached report summaries, briefing, coaching (report viewer "Generate summary").
- **Token refresh** — FFLogs refresh_token handling when access token expires.

## Phase 3

- **Mitigation & timeline** — Mitigation views, timeline overlays (Cactbot-style references).
- **Team features** — Static/team context, shared reports.
- **Expanded AI** — Parse explanation, anomaly detection, coaching per fight.

## Phase 4

- **Monetization / premium** — Optional paid tiers or premium features (if applicable).

## FFLogs v2 API — omitted endpoints (backlog)

Endpoints and fields from the [FFLogs v2 API](https://www.fflogs.com/v2-api-docs/ff) not yet implemented. Each has a potential use case for future work.

- **reportComponentData** — `list`, `get(key)`, `evaluateScript(contents, filter, debug, reportCode)`. *Use:* Custom overlay components, script-based report widgets; integrate with overlay/stream context if we support user-defined components.
- **systemReportComponentData** — Root field; exact shape TBD from schema. *Use:* System-built report components or overlays.
- **worldData.subregion(id)** — Single subregion. *Use:* Finer server grouping (e.g. NA East vs West) in filters or server browser.
- **worldData.region(id)** — Single region by id (we use `regions` list and `region(id).servers`). *Use:* Region detail page or when we only need one region by id.
- **gameData.item(id), gameData.items(limit, page)** — *Use:* Gear/item reference; character gear tooltips or “bis” style views if we show character.gameData.
- **gameData.map(id), gameData.maps(limit, page)** — *Use:* Map reference for encounter/zone UI.
- **Character.encounterRankings(encounterID, ...)** — *Use:* “Parse history” for a character on a specific boss; character drill-down.
- **Character.gameData(specID, forceUpdate)** — *Use:* Cached Lodestone gear/job for a character; show in profile or character card.
- **Encounter.characterRankings(...), Encounter.fightRankings(...)** — *Use:* Public encounter leaderboards (per server/region/size) in a “Rankings” or “Tier” view.
- **Guild.members(limit, page)** — *Use:* Alternative to characterData.characters(guildID) when we want guild-scoped member list with guild-specific fields (if any).
- **Guild.currentUserRank** — *Use:* “Your rank” in guild (user-scoped) in My guilds card.

## References

- **ACT OverlayPlugin** — [OverlayPlugin](https://github.com/ngld/OverlayPlugin) for combat data and overlays.
- **Cactbot** — [Cactbot](https://github.com/quisquous/cactbot) overlays and triggers; Hydaelyn aligns pull/encounter semantics with Cactbot where relevant.
- **ACT ODBC** — Optional export to Supabase; Hydaelyn schema `hydaelyn` mirrors `encounter_table`, `combatant_table`, etc. See README and migration `20260503120000_hydaelyn_act_odbc_views.sql`.
