# TrueNAS indexer inventory (metadata only)

Raw exports from `truenas-data` (`10.0.0.5`) live in **`_truenas-export/`** (gitignored).  
This file is safe to commit: **no API keys, cookies, or passwords.**

## Source paths (TrueNAS)

| App | Dataset / path |
| --- | --- |
| Jackett | `/mnt/HYPER-MNKY/apps/jackett/Jackett/` |
| Prowlarr | `/mnt/.ix-apps/app_mounts/prowlarr/config/` |
| qBittorrent | `/mnt/.ix-apps/app_mounts/qbittorrent/config/qBittorrent/` |

## Prowlarr (from `prowlarr.db` snapshot)

Indexers configured at export time (name + implementation only):

| Name | Implementation |
| --- | --- |
| The Pirate Bay | Cardigann |
| kickasstorrents.ws | Cardigann |
| 1337x | Cardigann |
| LimeTorrents | Cardigann |
| Nyaa.si | Cardigann |
| LinuxTracker | Cardigann |
| EZTV | Cardigann |
| TorrentDownload | Cardigann |
| YTS | Cardigann |
| TorrentGalaxyClone | Cardigann |
| Jackett - All Indexers | Torznab |
| AudiobookBay | Torznab |

**Note:** `Jackett - All Indexers` aggregates your Jackett instance via Torznab (same pattern to use on MOOD-MNKY: `http://jackett:9117/...` after Jackett is migrated).

## Jackett

- **Indexer definition files pulled:** 204 JSON files under `Indexers/` (filenames = indexer IDs, e.g. `1337x.json`).
- **Server:** `ServerConfig.json` includes FlareSolverr base `http://10.0.0.5:31027` (align with Prowlarr FlareSolverr proxy on the new stack).

## qBittorrent

- App settings under `qBittorrent/` (categories, preferences). **Do not commit** unredacted `qBittorrent.conf` (contains WebUI password hash and session secrets).

## New stack wiring

1. Add **Jackett** (see `docker-compose.yml`).
2. Run **`scripts/apply-truenas-jackett-config.sh`** once to import indexer JSON + patched `ServerConfig` (port **9117**).
3. In **Prowlarr**, add or update **Torznab → Jackett “all”** URL and API key (from Jackett UI after import), or re-sync existing apps.
