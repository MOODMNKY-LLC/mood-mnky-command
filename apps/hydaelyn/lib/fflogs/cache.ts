/**
 * FFLogs response cache (Supabase fflogs_response_cache).
 * Server-only; use from API routes or server components.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

const CACHE_TTL_MINUTES = 10;
const CACHE_TTL_WORLD_GAME_MINUTES = 24 * 60; // 24h for world/game data

function isStale(cachedAt: string, ttlMinutes: number = CACHE_TTL_MINUTES): boolean {
  const age = Date.now() - new Date(cachedAt).getTime();
  return age > ttlMinutes * 60 * 1000;
}

export async function getCached<T>(
  supabase: SupabaseClient,
  cacheKey: string,
  options?: { ttlMinutes?: number },
): Promise<T | null> {
  const ttl = options?.ttlMinutes ?? CACHE_TTL_MINUTES;
  const { data } = await supabase
    .from("fflogs_response_cache")
    .select("payload, cached_at")
    .eq("cache_key", cacheKey)
    .maybeSingle();
  if (!data?.payload || isStale(data.cached_at as string, ttl)) return null;
  return data.payload as T;
}

/** Use for world/game data that rarely changes. */
export const WORLD_GAME_TTL = { ttlMinutes: CACHE_TTL_WORLD_GAME_MINUTES };

export async function setCached(
  supabase: SupabaseClient,
  cacheKey: string,
  kind: string,
  payload: unknown,
  reportCode?: string | null,
): Promise<void> {
  await supabase.from("fflogs_response_cache").upsert(
    {
      cache_key: cacheKey,
      report_code: reportCode ?? null,
      kind,
      payload: payload as Record<string, unknown>,
      cached_at: new Date().toISOString(),
    },
    { onConflict: "cache_key" },
  );
}

/** Profile (characters + guilds) for the linked FFLogs user. Key by Supabase profile_id. */
export function userProfileCacheKey(profileId: string): string {
  return `user_profile:${profileId}`;
}

export function reportListCacheKey(
  userId: number | string,
  page: number,
  opts?: { startTime?: number; endTime?: number; zoneID?: number; guildID?: number },
): string {
  const parts = [`reports:user:${userId}:page:${page}`];
  if (opts?.startTime != null) parts.push(`st:${opts.startTime}`);
  if (opts?.endTime != null) parts.push(`et:${opts.endTime}`);
  if (opts?.zoneID != null) parts.push(`z:${opts.zoneID}`);
  if (opts?.guildID != null) parts.push(`g:${opts.guildID}`);
  return parts.join(":");
}

export function reportDetailCacheKey(reportCode: string, kind: string): string {
  return `report:${reportCode}:${kind}`;
}

export function reportTableCacheKey(
  reportCode: string,
  fightIds: number[],
  dataType: string,
  viewBy: string,
): string {
  const f = fightIds.length ? fightIds.sort((a, b) => a - b).join(",") : "all";
  return `report:${reportCode}:table:${f}:${dataType}:${viewBy}`;
}

export function reportGraphCacheKey(
  reportCode: string,
  fightIds: number[],
  dataType: string,
  viewBy: string,
): string {
  const f = fightIds.length ? fightIds.sort((a, b) => a - b).join(",") : "all";
  return `report:${reportCode}:graph:${f}:${dataType}:${viewBy}`;
}

export function reportRankingsCacheKey(
  reportCode: string,
  fightIds: number[],
  compare?: string,
  timeframe?: string,
): string {
  const f = fightIds.length ? fightIds.sort((a, b) => a - b).join(",") : "all";
  return `report:${reportCode}:rankings:${f}:${compare ?? "default"}:${timeframe ?? "default"}`;
}

export function reportPlayerDetailsCacheKey(reportCode: string, fightIds: number[]): string {
  const f = fightIds.length ? fightIds.sort((a, b) => a - b).join(",") : "all";
  return `report:${reportCode}:playerDetails:${f}`;
}

export function reportEventsCacheKey(
  reportCode: string,
  fightIds: number[],
  limit: number,
  startTime?: number,
): string {
  const f = fightIds.length ? fightIds.sort((a, b) => a - b).join(",") : "all";
  return `report:${reportCode}:events:${f}:${limit}:${startTime ?? 0}`;
}

export function reportMasterDataCacheKey(reportCode: string): string {
  return `report:${reportCode}:masterData`;
}

export function characterCacheKey(opts: {
  id?: number;
  name?: string;
  server?: string;
  region?: string;
  lodestoneID?: number;
}): string {
  if (opts.id != null) return `character:id:${opts.id}`;
  if (opts.lodestoneID != null) return `character:lodestone:${opts.lodestoneID}`;
  if (opts.name && opts.server && opts.region) {
    return `character:${opts.region}:${opts.server}:${opts.name}`;
  }
  return `character:${JSON.stringify(opts)}`;
}

export function guildCharactersCacheKey(guildID: number, page: number): string {
  return `characters:guild:${guildID}:page:${page}`;
}

export function guildCacheKey(opts: { id?: number; name?: string; server?: string; region?: string }): string {
  if (opts.id != null) return `guild:id:${opts.id}`;
  if (opts.name && opts.server && opts.region) {
    return `guild:${opts.region}:${opts.server}:${opts.name}`;
  }
  return `guild:${JSON.stringify(opts)}`;
}

export function guildsCacheKey(page: number, serverID?: number): string {
  return serverID != null ? `guilds:page:${page}:server:${serverID}` : `guilds:page:${page}`;
}

export function zonesCacheKey(expansionId?: number): string {
  return expansionId != null ? `world:zones:exp:${expansionId}` : `world:zones`;
}

export function zoneCacheKey(id: number): string {
  return `world:zone:${id}`;
}

/** Expanded zone (encounters, difficulties, partitions, expansion, frozen). */
export function zoneDetailCacheKey(id: number): string {
  return `world:zone:${id}:detail`;
}

export function expansionCacheKey(id: number): string {
  return `world:expansion:${id}`;
}

export function encounterCacheKey(id: number): string {
  return `world:encounter:${id}`;
}

export function expansionsCacheKey(): string {
  return `world:expansions`;
}

export function regionsCacheKey(): string {
  return `world:regions`;
}

export function serverCacheKey(id?: number, region?: string, slug?: string): string {
  if (id != null) return `world:server:${id}`;
  return `world:server:${region ?? ""}:${slug ?? ""}`;
}

export function serversByRegionCacheKey(regionId: number, page?: number): string {
  return `world:servers:region:${regionId}:page:${page ?? 1}`;
}

export function classesCacheKey(zoneId?: number, factionId?: number): string {
  return `game:classes:${zoneId ?? "all"}:${factionId ?? "all"}`;
}

export function classCacheKey(id: number): string {
  return `game:class:${id}`;
}

export function abilitiesCacheKey(page: number): string {
  return `game:abilities:page:${page}`;
}

export function abilityCacheKey(id: number): string {
  return `game:ability:${id}`;
}

export function rateLimitCacheKey(): string {
  return `ratelimit:current`;
}

export function progressRaceCacheKey(opts?: Record<string, string | number | undefined>): string {
  if (!opts || Object.keys(opts).length === 0) return `progressrace:current`;
  const parts = Object.entries(opts)
    .filter(([, v]) => v != null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `progressrace:${parts.join(":")}`;
}

export function progressRaceCompositionCacheKey(opts: Record<string, string | number | undefined>): string {
  const parts = Object.entries(opts)
    .filter(([, v]) => v != null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`);
  return `progressrace:composition:${parts.join(":")}`;
}

export function characterRecentReportsCacheKey(characterId: number, page: number): string {
  return `character:${characterId}:reports:page:${page}`;
}

export function characterZoneRankingsCacheKey(
  characterId: number,
  zoneId: number,
  opts?: Record<string, string | number | undefined>,
): string {
  const parts = opts ? Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join(":") : "default";
  return `character:${characterId}:zoneRankings:${zoneId}:${parts}`;
}

export function characterGameDataCacheKey(characterId: number, specID?: number, forceUpdate?: boolean): string {
  const spec = specID != null ? `spec:${specID}` : "spec:default";
  const force = forceUpdate ? "force" : "cached";
  return `character:${characterId}:gameData:${spec}:${force}`;
}

export function characterEncounterRankingsCacheKey(
  characterId: number,
  encounterId: number,
  opts?: Record<string, string | number | undefined>,
): string {
  const parts = opts ? Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join(":") : "default";
  return `character:${characterId}:encounterRankings:${encounterId}:${parts}`;
}

export function guildCurrentUserRankCacheKey(guildId: number): string {
  return `guild:${guildId}:currentUserRank`;
}

export function encounterCharacterRankingsCacheKey(
  encounterId: number,
  opts?: Record<string, string | number | undefined>,
): string {
  const parts = opts ? Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join(":") : "default";
  return `encounter:${encounterId}:characterRankings:${parts}`;
}

export function encounterFightRankingsCacheKey(
  encounterId: number,
  opts?: Record<string, string | number | undefined>,
): string {
  const parts = opts ? Object.entries(opts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join(":") : "default";
  return `encounter:${encounterId}:fightRankings:${parts}`;
}

export function factionsCacheKey(): string {
  return `game:factions`;
}

export function guildAttendanceCacheKey(guildId: number, opts?: { guildTagID?: number; zoneID?: number; page?: number }): string {
  const tag = opts?.guildTagID ?? "all";
  const zone = opts?.zoneID ?? "all";
  const page = opts?.page ?? 1;
  return `guild:${guildId}:attendance:${tag}:${zone}:page:${page}`;
}

export function guildZoneRankingCacheKey(guildId: number, zoneId?: number): string {
  return `guild:${guildId}:zoneRanking:${zoneId ?? "latest"}`;
}
