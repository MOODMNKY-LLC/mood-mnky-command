# FFXIV reference data

JSON files aligned with Cactbot and FFLogs for consistent encounter/job naming across overlays and Hydaelyn.

- **encounter-ids.json** — Zones and encounters (FFLogs IDs). Each zone can include `category` (`savage` | `ultimates` | `trials` | `raids` | `dungeons`) for duty filtering and sidebar. Add new tiers when they release; sync with any FFXIV app's encounter logic if present.
- **job-ids.json** — Job ID to abbreviation and name. Matches game log / ACT job IDs used in OverlayPlugin CombatData.

These files are consumed by tooling or an FFXIV app when present.

## Refreshing from FFLogs when new tiers release

1. **Zones and encounters** — Call FFLogs v2 `worldData.zones` (and optionally `worldData.zone(id)` for encounter lists). Merge new zones/encounters into `encounter-ids.json`. Set `category` from zone name/difficulty (e.g. name contains "Savage" → `savage`, "Ultimate" → `ultimates`).
2. **Hydaelyn app** — `apps/hydaelyn/lib/fflogs/zone-categories.ts` maps zone IDs to duty categories; update `zoneIdCategoryMap` there if you add new tiers, or rely on name heuristics.
3. **Overlay ingest** — OverlayPlugin sends `zoneID` via CombatData or ChangeZone; ingest stores it in `last_combat_data.zone_id` for mapping to FFLogs/Cactbot zone IDs.
