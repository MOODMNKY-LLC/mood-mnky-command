# FFLogs v2 API — What We Can Retrieve and Do With It

This document lists **everything** the FFLogs v2 GraphQL API exposes that we can use in Hydaelyn, what we already use, and how we can transform or extend it. Use it to plan new features.

**API base:** `https://www.fflogs.com/api/v2/user` (with Bearer token)  
**Schema docs:** https://www.fflogs.com/v2-api-docs/ff/

---

## 1. Root query: what’s available at the top level

| Root field | Purpose |
|------------|--------|
| **reportData** | Single report by code, or paginated reports by user/guild/zone/time. |
| **userData** | Current user (`currentUser`) or user by id. |
| **characterData** | Character by id or by name/server/region; characters in a guild. |
| **guildData** | Guild by id or name/server/region; paginated guilds. |
| **worldData** | Expansions, zones, encounters, regions, subregions, servers. |
| **gameData** | Static game data: abilities, classes, factions, items, maps. |
| **rateLimitData** | Rate limit / points spent (for this API key). |
| **progressRaceData** | World/realm first race (when active). |
| **reportComponentData** | Saved report components and script evaluation. |

We currently use: **reportData** (reports list + report by code) and **userData** (currentUser for link/sign-in).

---

## 2. reportData — reports list (what we already pull)

**Query:** `reportData.reports(userID, limit, page, startTime?, endTime?, zoneID?, gameZoneID?, guildID?, guildTagID?, ...)`

**Returns (per item):**

| Field | Type | We use? | Notes |
|-------|------|--------|-------|
| code | String | Yes | Report code (unique id). |
| title | String | Yes | Report title. |
| startTime | Int (ms) | Yes | Start time. |
| endTime | Int (ms) | Yes | End time. |
| owner | User | Yes | { id, name }. |
| has_more_pages | Boolean | Yes | Pagination. |
| last_page | Int | Yes | Last page number. |

**What we can do with the list:**

- Show “My reports” in dashboard (done).
- Filter by time range (`startTime`, `endTime`), zone (`zoneID`, `gameZoneID`), or guild (`guildID`, `guildTagID`).
- Sort/filter in the app (e.g. by date, zone, title).
- Link each row to report viewer `/reports/[code]`.
- Sync a subset into our DB (e.g. “recent 50”) for offline or faster listing.

---

## 3. reportData.report(code) — single report (current and possible)

**Query:** `reportData.report(code: String!, allowUnlisted?: Boolean)`

### 3.1 Fields we already use

| Field | Type | Used in | Notes |
|-------|------|---------|-------|
| code | String | Report page | Report id. |
| title | String | Report page | Title. |
| startTime | Int | Report page | Start (ms). |
| endTime | Int | Report page | End (ms). |
| owner | User | Report page | Uploader. |
| fights | [ReportFight] | Report page | Fights with id, name, startTime, endTime, kill. |

### 3.2 Fields we don’t use yet (all available on Report)

| Field | Type | What it gives you |
|-------|------|-------------------|
| **zone** | Zone | Default zone for the report (expansion, id, name). |
| **region** | Region | Report region. |
| **guild** | Guild | Guild if uploaded to a guild. |
| **guildTag** | GuildTag | Tag if tagged. |
| **visibility** | String | `'public' \| 'private' \| 'unlisted'`. |
| **revision** | Int | Bumps when report is re-exported. |
| **segments** | Int | Number of uploaded segments. |
| **exportedSegments** | Int | Segments processed for rankings. |
| **archiveStatus** | ReportArchiveStatus | Whether archived; archive access. |
| **phases** | [EncounterPhases] | Phase info for bosses (needs fights loaded). |
| **rankedCharacters** | [Character] | Characters that have ranked kills in the report. |
| **masterData** | ReportMasterData | Version, actors (players/NPCs/pets), abilities. |
| **table** | (see below) | Parses / DPS table by fight/source/target/ability. |
| **graph** | (see below) | Time-series (e.g. DPS over time). |
| **events** | ReportEventPaginator | Raw combat events (heavy, filterable). |
| **rankings** | (see below) | Rank/parse info per fight. |
| **playerDetails** | (see below) | Specs, talents, gear per player. |

---

## 4. Report.table — parse/DPS table (high value)

**Query:** `reportData.report(code).table(...)`

**Filters (among others):** `fightIDs`, `encounterID`, `difficulty`, `killType`, `dataType`, `viewBy`, `startTime`, `endTime`, `sourceID`, `targetID`, `translate`, etc.

**Typical use:**

- **dataType:** e.g. Summary, DamageDone, Healing, Deaths, etc. (exact values in schema: TableDataType).
- **viewBy:** Source (per player), Target, or Ability.
- **fightIDs:** One or more fight ids from `fights`.

**Returns:** Table rows (e.g. per player, per ability) — DPS, HPS, damage taken, deaths, etc., depending on `dataType` and `viewBy`.

**What we can do:**

- Show “Parse table” per fight: damage done, healing, deaths.
- Per-player breakdown (job, spec, DPS, percentiles if exposed).
- Store in `fflogs_response_cache` (e.g. `report:{code}:table:{fightId}`) and render in report viewer.
- Feed into OpenAI for summaries or coaching (“top DPS”, “who died”, “healing breakdown”).

---

## 5. Report.graph — time-series (e.g. DPS over time)

**Query:** `reportData.report(code).graph(...)`

**Filters:** Same idea as table (fightIDs, encounterID, dataType, viewBy, startTime, endTime, etc.). **dataType** comes from GraphDataType.

**Returns:** Time-series data (e.g. DPS per second) for charts.

**What we can do:**

- Draw DPS/HPS over time in report viewer (e.g. Recharts).
- Cache by report + fight + dataType; optional “show graph” tab.

---

## 6. Report.rankings — parse/rank info

**Query:** `reportData.report(code).rankings(...)`

**Filters:** `compare` (rankings vs parses), `difficulty`, `encounterID`, `fightIDs`, `playerMetric`, `timeframe` (today vs historical).

**Returns:** Ranking/parse data per player per fight (percentiles, rank, etc.).

**What we can do:**

- Show “Best parses” or “Rankings” section per fight.
- “Orange parse”, “95th percentile” style badges.
- Cache and display in report viewer.

---

## 7. Report.playerDetails — specs, talents, gear

**Query:** `reportData.report(code).playerDetails(..., includeCombatantInfo?: Boolean)`

**Filters:** difficulty, encounterID, fightIDs, killType, startTime, endTime, translate.

**Returns:** Player list with spec, talents, gear (if `includeCombatantInfo`), etc.

**What we can do:**

- Show “Roster” / “Composition” (jobs, specs).
- Optional “Gear” or “Builds” view; link to job icons (our MOOD MNKY icons).

---

## 8. Report.events — raw combat log

**Query:** `reportData.report(code).events(...)`

**Filters:** Many (abilityID, dataType, death, fightIDs, sourceID, targetID, startTime, endTime, limit, filterExpression, etc.).

**Returns:** Paginated raw events (damage, heals, deaths, auras, etc.). **Heavy** and “not frozen”; use for custom analysis, not default UI.

**What we can do:**

- “Death timeline”, “ability usage”, or custom analytics.
- Optional “Events” tab or export; consider rate limits and caching.

---

## 9. Report.masterData — actors and abilities

**Query:** `reportData.report(code).masterData(translate?: Boolean)`

**Returns:** Version info; all actors (players, NPCs, pets) and abilities in the report.

**What we can do:**

- Resolve actor/ability names for table/graph/events.
- Build a “Who was in this pull” list; optional tooltips with ability names.

---

## 10. characterData — characters

**Queries:**

- `characterData.character(id | name, serverSlug, serverRegion | lodestoneID)`
- `characterData.characters(guildID, limit, page)`

**Returns:** Character info (name, server, region, class/spec, etc.). Character type can link to rankings, parses, etc.

**What we can do:**

- “My character” page (by name + server + region or id).
- Character parses/rankings across reports.
- Guild roster (characters in a guild).

---

## 11. guildData — guilds

**Queries:**

- `guildData.guild(id | name, serverSlug, serverRegion)`
- `guildData.guilds(limit, page, serverID | serverSlug, serverRegion)`

**What we can do:**

- List reports by guild (we already have `reportData.reports(guildID, ...)`).
- Guild info page; link “Uploaded to guild X” on report.

---

## 12. worldData — zones, encounters, expansions, servers

**Queries:** `worldData.zone(id)`, `worldData.zones(expansion_id?)`, `worldData.encounter(id)`, `worldData.expansion(id)`, `worldData.expansions`, `worldData.regions`, `worldData.server(id | region, slug)`, etc.

**What we can do:**

- Map zone/encounter ids to names (for report list and report viewer).
- Filter reports by zone; “Encounters in this report” with proper names.
- Server/region dropdowns if we add character or guild features.

---

## 13. gameData — static game data

**Queries:** `gameData.abilities`, `gameData.ability(id)`, `gameData.classes`, `gameData.class(id)`, `gameData.factions`, `gameData.items`, `gameData.maps`, etc.

**What we can do:**

- Job/class names and slugs (for filters and our job icons).
- Ability names for tooltips or event breakdowns.
- Cache long-term (only changes with patches).

---

## 14. rateLimitData — rate limits

**What we can do:** Check points spent / remaining so we don’t overcall; show “API usage” in dashboard or back off when low.

---

## 15. What we already do vs what we can add (summary)

| Area | Current | Possible next steps |
|------|--------|---------------------|
| Reports list | Fetch and show; pagination | Filter by zone/time; optional DB sync. |
| Report meta | code, title, times, owner, fights | Add zone, region, guild, visibility, phases. |
| Fights | List with id, name, times, kill | Use fight ids in table/graph/rankings. |
| Table | Not requested | Add `report.table(...)` for DPS/parses; cache; show in viewer. |
| Graph | Not requested | Add `report.graph(...)`; cache; DPS-over-time chart. |
| Rankings | Not requested | Add `report.rankings(...)`; parse/rank badges. |
| Player details | Not requested | Add `report.playerDetails(...)`; roster, gear. |
| Events | Not requested | Optional; death timeline or custom analytics. |
| Master data | Not requested | Optional; actor/ability names. |
| Characters | Not used | Character page; parses by character. |
| Guilds | Not used | Guild filter; guild info. |
| World/game | Not used | Zone/encounter names; job/ability lookups. |

---

## 16. Transformations and product ideas

**With the data above we can:**

1. **Report viewer**
   - Per-fight tabs: Summary table (DPS/healing), Graph (DPS over time), Rankings (parses), Roster (playerDetails), optional Events.
2. **Caching**
   - Cache table, graph, rankings, playerDetails in `fflogs_response_cache` by report code + fight id + dataType (and TTL).
3. **OpenAI / insights**
   - Input: table (who did damage, who died), rankings (who parsed well), playerDetails (comp).
   - Output: short summary, “what went wrong”, “top performers”, coaching bullets; store in `report_insights`.
4. **Dashboards**
   - “Best parses” across reports (from rankings).
   - “Recent kills” (reports + fights with kill=true).
5. **Character-centric**
   - Character page: fetch `characterData.character` and reports where they appear; show parses over time.
6. **Guild-centric**
   - “Guild reports” and “Guild roster” using reportData.reports(guildID) and characterData.characters(guildID).

---

## 17. Schema and field names

FFLogs often uses **snake_case** in GraphQL (e.g. `has_more_pages`, `last_page`). When adding new queries, check the schema docs and use the exact field names (and handle snake_case in JSON if we normalize to camelCase in app code).

**Schema reference:** https://www.fflogs.com/v2-api-docs/ff/

---

## 18. References

- FFLogs API docs: https://www.fflogs.com/api/docs  
- v2 schema (FF): https://www.fflogs.com/v2-api-docs/ff/  
- Report type: https://www.fflogs.com/v2-api-docs/ff/report.doc.html  
- Our client: `apps/hydaelyn/lib/fflogs/client.ts`  
- Our cache: `apps/hydaelyn/lib/fflogs/cache.ts`  
- Report viewer: `apps/hydaelyn/app/reports/[code]/page.tsx`
