/**
 * Lodestone character data via XIVAPI (https://xivapi.com).
 * XIVAPI scrapes the official Lodestone; no Square Enix official API exists.
 * Optional API key improves rate limits: set XIVAPI_API_KEY in env.
 */

const XIVAPI_BASE = process.env.XIVAPI_BASE_URL ?? "https://xivapi.com";
const XIVAPI_KEY = process.env.XIVAPI_API_KEY ?? "";

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(path, XIVAPI_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") url.searchParams.set(k, v);
  });
  if (XIVAPI_KEY) url.searchParams.set("key", XIVAPI_KEY);
  return url.toString();
}

/** XIVAPI character search result item */
export type XIVAPICharacterSearchResult = {
  ID?: number;
  Name?: string;
  Server?: string;
  Avatar?: string;
  [key: string]: unknown;
};

/** XIVAPI character profile (from /character/:id) */
export type XIVAPICharacterResponse = {
  Character?: {
    ID?: number;
    Name?: string;
    Server?: string;
    Avatar?: string;
    Title?: { Name?: string };
    ClassJobs?: unknown[];
    Gear?: unknown;
    [key: string]: unknown;
  };
  ClassJobs?: unknown[];
  ClassJobsBozjan?: unknown;
  Minion?: unknown[];
  Mount?: unknown[];
  [key: string]: unknown;
};

/** Normalized gear/job summary for our UI */
export type LodestoneCharacterData = {
  source: "lodestone";
  lodestoneId: number;
  name?: string;
  server?: string;
  avatar?: string;
  classJobs?: Array<{ name?: string; level?: number; jobId?: number }>;
  /** Raw payload for pre display if needed */
  raw?: unknown;
};

/**
 * Search character by name and server. Returns first match's Lodestone ID or null.
 * Server: FFLogs server slug (e.g. "cactuar") or full name; XIVAPI expects server name (e.g. "Cactuar").
 */
export async function searchCharacter(
  name: string,
  server: string,
): Promise<{ lodestoneId: number; name?: string; server?: string } | null> {
  const trimmedName = name.trim();
  const trimmedServer = server.trim();
  if (!trimmedName || !trimmedServer) return null;

  // XIVAPI expects server name; try title-case (Cactuar) and lowercase
  const serverVariants = [
    trimmedServer.charAt(0).toUpperCase() + trimmedServer.slice(1).toLowerCase(),
    trimmedServer,
  ];
  for (const serverName of serverVariants) {
    const url = buildUrl("/character/search", {
      name: trimmedName,
      server: serverName,
    });
    const res = await fetch(url);
    if (!res.ok) continue;
    const data = (await res.json()) as {
      Results?: XIVAPICharacterSearchResult[];
      Error?: string;
    };
    if (data.Error || !Array.isArray(data.Results) || data.Results.length === 0) continue;
    const first = data.Results[0] as { ID?: number; Name?: string; Server?: string } | undefined;
    const id = first?.ID;
    if (id != null) {
      return {
        lodestoneId: id,
        name: first?.Name ?? trimmedName,
        server: first?.Server ?? serverName,
      };
    }
  }
  return null;
}

/**
 * Fetch character profile by Lodestone ID. Returns normalized data for gear/job display.
 */
export async function fetchCharacterByLodestoneId(
  lodestoneId: number,
): Promise<LodestoneCharacterData | null> {
  const url = buildUrl(`/character/${lodestoneId}`, { extended: "1" });
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as XIVAPICharacterResponse;
  const char = data?.Character ?? data;
  const id = (char as { ID?: number }).ID ?? lodestoneId;
  const classJobs = (data?.ClassJobs ?? (char as { ClassJobs?: unknown[] }).ClassJobs) as
    | Array<{ Name?: string; Level?: number; JobID?: number; UnlockedState?: { Name?: string } }>
    | undefined;
  const normalizedJobs = Array.isArray(classJobs)
    ? classJobs.map((j) => ({
        name: j?.UnlockedState?.Name ?? j?.Name ?? undefined,
        level: j?.Level,
        jobId: j?.JobID,
      }))
    : undefined;

  return {
    source: "lodestone",
    lodestoneId: id,
    name: (char as { Name?: string }).Name,
    server: (char as { Server?: string }).Server,
    avatar: (char as { Avatar?: string }).Avatar,
    classJobs: normalizedJobs,
    raw: data,
  };
}

/**
 * Get Lodestone character data by Lodestone ID or by name + server (search then fetch).
 */
export async function getLodestoneCharacter(
  options: { lodestoneId: number } | { name: string; server: string },
): Promise<LodestoneCharacterData | null> {
  if ("lodestoneId" in options) {
    return fetchCharacterByLodestoneId(options.lodestoneId);
  }
  const searchResult = await searchCharacter(options.name, options.server);
  if (!searchResult) return null;
  return fetchCharacterByLodestoneId(searchResult.lodestoneId);
}
