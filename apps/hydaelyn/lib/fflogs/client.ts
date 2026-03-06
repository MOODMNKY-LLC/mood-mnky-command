/**
 * FFLogs OAuth and v2 user API client (server-only).
 * Uses FFLOGS_CLIENT_ID and FFLOGS_CLIENT_SECRET from env.
 *
 * API docs: https://www.fflogs.com/api/docs
 * v2 GraphQL schema (e.g. for reportData.report, rankings, table): https://www.fflogs.com/v2-api-docs/ff
 */

import crypto from "crypto";

const FFLOGS_AUTHORIZE_URL = "https://www.fflogs.com/oauth/authorize";
const FFLOGS_TOKEN_URL = "https://www.fflogs.com/oauth/token";
const FFLOGS_USER_API_URL = "https://www.fflogs.com/api/v2/user";

export type FFLogsTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

export type FFLogsUser = {
  id: number | string;
  name?: string;
  username?: string;
};

/** Character from user profile (claimed by the user). Region via server.region. */
export type FFLogsUserCharacter = {
  id: number;
  name?: string;
  server?: { id?: number; slug?: string; region?: { id?: number; name?: string; slug?: string } };
};

/** Guild from user profile (Free Company or Static). type: 0 = FC, 1 = Static. */
export type FFLogsUserGuild = {
  id: number;
  name?: string;
  description?: string;
  type?: number;
  server?: { id?: number; slug?: string; region?: { id?: number; name?: string; slug?: string } };
  tags?: Array<{ id: number; name?: string }>;
};

export type FFLogsUserProfile = {
  id: number;
  name?: string;
  avatar?: string;
  characters: FFLogsUserCharacter[];
  guilds: FFLogsUserGuild[];
};

function getConfig() {
  const clientId = process.env.FFLOGS_CLIENT_ID;
  const clientSecret = process.env.FFLOGS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "FFLogs OAuth not configured. Set FFLOGS_CLIENT_ID and FFLOGS_CLIENT_SECRET.",
    );
  }
  return { clientId, clientSecret };
}

async function graphqlRequest<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(FFLOGS_USER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FFLogs request failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as { data?: T; errors?: Array<{ message: string }> };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }
  if (json.data == null) {
    throw new Error("FFLogs response missing data");
  }
  return json.data;
}

/**
 * Exchange authorization code for access token (and optional refresh token).
 * redirectUri must match the URI used in the authorize request.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<FFLogsTokenResponse> {
  const { clientId, clientSecret } = getConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });
  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
    body.set("client_id", clientId);
  }

  // FFLogs requires HTTP Basic auth (client_id:client_secret) for the token endpoint
  // even when using PKCE (401 "Client authentication failed" otherwise).
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(FFLOGS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FFLogs token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as FFLogsTokenResponse;
  if (!data.access_token) {
    throw new Error("FFLogs token response missing access_token");
  }
  return data;
}

/**
 * Refresh access token using refresh_token (if FFLogs supports it).
 * Returns new tokens or throws.
 */
export async function refreshAccessToken(
  refreshToken: string,
): Promise<FFLogsTokenResponse> {
  const { clientId, clientSecret } = getConfig();
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(FFLOGS_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FFLogs token refresh failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as FFLogsTokenResponse;
  if (!data.access_token) {
    throw new Error("FFLogs refresh response missing access_token");
  }
  return data;
}

/**
 * Fetch current user from FFLogs v2 user API (GraphQL).
 * Requires a valid access_token from the authorization code or PKCE flow.
 */
export async function fetchFFLogsUser(accessToken: string): Promise<FFLogsUser> {
  const query = `
    query {
      userData {
        currentUser {
          id
          name
        }
      }
    }
  `;

  const res = await fetch(FFLOGS_USER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FFLogs user fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    data?: { userData?: { currentUser?: { id: number; name?: string } } };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(
      `FFLogs user query error: ${json.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const currentUser = json.data?.userData?.currentUser;
  if (!currentUser || currentUser.id == null) {
    throw new Error("FFLogs user response missing userData.currentUser.id");
  }

  return {
    id: currentUser.id,
    name: currentUser.name,
    username: currentUser.name,
  };
}

/**
 * Fetch full user profile from FFLogs v2 user API: claimed characters and guilds/statics.
 * Requires view-user-profile scope (requested in OAuth authorize).
 */
export async function fetchFFLogsUserProfile(
  accessToken: string,
): Promise<FFLogsUserProfile> {
  const query = `
    query {
      userData {
        currentUser {
          id
          name
          avatar
          characters {
            id
            name
            server { id slug region { id name slug } }
          }
          guilds {
            id
            name
            description
            type
            server { id slug region { id name slug } }
            tags { id name }
          }
        }
      }
    }
  `;

  const res = await fetch(FFLOGS_USER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FFLogs profile fetch failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    data?: {
      userData?: {
        currentUser?: {
          id: number;
          name?: string;
          avatar?: string;
          characters?: FFLogsUserCharacter[];
          guilds?: FFLogsUserGuild[];
        };
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (json.errors?.length) {
    throw new Error(
      `FFLogs profile query error: ${json.errors.map((e) => e.message).join(", ")}`,
    );
  }

  const currentUser = json.data?.userData?.currentUser;
  if (!currentUser || currentUser.id == null) {
    throw new Error("FFLogs profile response missing userData.currentUser");
  }

  return {
    id: currentUser.id,
    name: currentUser.name,
    avatar: currentUser.avatar,
    characters: Array.isArray(currentUser.characters) ? currentUser.characters : [],
    guilds: Array.isArray(currentUser.guilds) ? currentUser.guilds : [],
  };
}

/**
 * Report list item (user's reports).
 */
export type FFLogsReportListItem = {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
  owner?: { id: number; name: string };
};

/** Options for report list (reportData.reports). */
export type ReportListOptions = {
  limit?: number;
  page?: number;
  startTime?: number;
  endTime?: number;
  zoneID?: number;
  gameZoneID?: number;
  guildID?: number;
  guildTagID?: number;
};

/**
 * Fetch report list for a user (FFLogs v2 reportData.reports).
 */
export async function fetchReportList(
  accessToken: string,
  userId: number | string,
  options?: ReportListOptions,
): Promise<{ data: FFLogsReportListItem[]; hasMorePages: boolean; lastPage: number }> {
  const limit = options?.limit ?? 50;
  const page = options?.page ?? 1;
  const query = `
    query($userID: Int!, $limit: Int!, $page: Int!, $startTime: Float, $endTime: Float, $zoneID: Int, $gameZoneID: Int, $guildID: Int, $guildTagID: Int) {
      reportData {
        reports(userID: $userID, limit: $limit, page: $page, startTime: $startTime, endTime: $endTime, zoneID: $zoneID, gameZoneID: $gameZoneID, guildID: $guildID, guildTagID: $guildTagID) {
          data {
            code
            title
            startTime
            endTime
            owner { id name }
          }
          has_more_pages
          last_page
        }
      }
    }
  `;
  const variables: Record<string, unknown> = {
    userID: Number(userId),
    limit,
    page,
  };
  if (options?.startTime != null) variables.startTime = options.startTime;
  if (options?.endTime != null) variables.endTime = options.endTime;
  if (options?.zoneID != null) variables.zoneID = options.zoneID;
  if (options?.gameZoneID != null) variables.gameZoneID = options.gameZoneID;
  if (options?.guildID != null) variables.guildID = options.guildID;
  if (options?.guildTagID != null) variables.guildTagID = options.guildTagID;

  const data = await graphqlRequest<{
    reportData?: {
      reports?: {
        data: FFLogsReportListItem[];
        has_more_pages?: boolean;
        last_page?: number;
      };
    };
  }>(accessToken, query, variables);
  const reports = data.reportData?.reports;
  if (!reports) {
    return { data: [], hasMorePages: false, lastPage: 1 };
  }
  return {
    data: reports.data ?? [],
    hasMorePages: reports.has_more_pages ?? false,
    lastPage: reports.last_page ?? 1,
  };
}

/**
 * Report detail: fights and optional table/rankings.
 */
export type FFLogsFight = {
  id: number;
  name?: string;
  startTime: number;
  endTime: number;
  kill?: boolean;
  encounterID?: number;
};

export type FFLogsZone = { id: number; name?: string };
export type FFLogsRegion = { id: number; name?: string };
export type FFLogsGuild = { id: number; name?: string };
export type FFLogsGuildTag = { id: number; name?: string };
/** Character in report context; region comes from server.region in the API. */
export type FFLogsCharacter = {
  id: number;
  name?: string;
  server?: { slug?: string; region?: { name?: string; slug?: string } };
  /** Present when normalized from server.region (e.g. from cache). */
  region?: { name?: string; slug?: string };
};

/** Phase metadata within an encounter (PhaseMetadata in FFLogs schema). */
export type FFLogsPhaseMetadata = { id: number; name?: string; isIntermission?: boolean };
/** Encounter phases for a report (EncounterPhases in FFLogs schema). */
export type FFLogsEncounterPhases = {
  encounterID: number;
  separatesWipes?: boolean;
  phases?: FFLogsPhaseMetadata[];
};

export type FFLogsReportDetail = {
  code: string;
  title: string;
  startTime: number;
  endTime: number;
  owner?: { id: number; name: string };
  fights?: FFLogsFight[];
  zone?: FFLogsZone | null;
  region?: FFLogsRegion | null;
  guild?: FFLogsGuild | null;
  guildTag?: FFLogsGuildTag | null;
  visibility?: string | null;
  revision?: number;
  segments?: number;
  exportedSegments?: number;
  archiveStatus?: { isArchived?: boolean } | null;
  phases?: FFLogsEncounterPhases[] | null;
  rankedCharacters?: FFLogsCharacter[] | null;
};

/** TableDataType enum values (FFLogs schema). */
export const TABLE_DATA_TYPES = [
  "Summary",
  "Buffs",
  "Casts",
  "DamageDone",
  "DamageTaken",
  "Deaths",
  "Debuffs",
  "Dispels",
  "Healing",
  "Interrupts",
  "Resources",
  "Summons",
  "Survivability",
  "Threat",
] as const;
export type TableDataType = (typeof TABLE_DATA_TYPES)[number];

/** ViewBy for table/graph: Source (per player), Target, Ability. */
export type ViewBy = "Source" | "Target" | "Ability";

/** Options for report table query. */
export type ReportTableOptions = {
  fightIDs?: number[];
  dataType?: TableDataType;
  viewBy?: ViewBy;
  encounterID?: number;
  difficulty?: number;
  killType?: string;
  startTime?: number;
  endTime?: number;
  sourceID?: number;
  targetID?: number;
  translate?: boolean;
};

/** Options for report graph query. */
export type ReportGraphOptions = ReportTableOptions;

/** Options for report rankings query. */
export type ReportRankingsOptions = {
  fightIDs?: number[];
  encounterID?: number;
  difficulty?: number;
  compare?: string;
  playerMetric?: string;
  timeframe?: string;
};

/** Options for report playerDetails query. */
export type ReportPlayerDetailsOptions = {
  fightIDs?: number[];
  encounterID?: number;
  difficulty?: number;
  killType?: string;
  startTime?: number;
  endTime?: number;
  includeCombatantInfo?: boolean;
  translate?: boolean;
};

/** Options for report events query. */
export type ReportEventsOptions = {
  fightIDs?: number[];
  limit?: number;
  startTime?: number;
  endTime?: number;
  dataType?: string;
  encounterID?: number;
  difficulty?: number;
  killType?: string;
  sourceID?: number;
  targetID?: number;
  translate?: boolean;
};

/**
 * Fetch a single report by code (FFLogs v2 reportData.report).
 * Use expandMeta: true to include zone, region, guild, visibility, phases, rankedCharacters.
 */
export async function fetchReportDetail(
  accessToken: string,
  reportCode: string,
  options?: { includeFights?: boolean; expandMeta?: boolean },
): Promise<FFLogsReportDetail> {
  const includeFights = options?.includeFights !== false;
  const expandMeta = options?.expandMeta === true;
  const query = `
    query($code: String!) {
      reportData {
        report(code: $code) {
          code
          title
          startTime
          endTime
          owner { id name }
          ${includeFights ? "fights { id name startTime endTime kill encounterID }" : ""}
          ${expandMeta ? "zone { id name } region { id name slug } guild { id name } guildTag { id name } visibility revision segments exportedSegments archiveStatus { isArchived } phases { encounterID separatesWipes phases { id name isIntermission } } rankedCharacters { id name server { slug region { name slug } } }" : ""}
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: { report?: Record<string, unknown> };
  }>(accessToken, query, { code: reportCode });
  const report = data.reportData?.report;
  if (!report) {
    throw new Error("FFLogs report not found");
  }
  const r = report as Record<string, unknown>;
  return {
    code: r.code as string,
    title: r.title as string,
    startTime: r.startTime as number,
    endTime: r.endTime as number,
    owner: r.owner as FFLogsReportDetail["owner"],
    fights: r.fights as FFLogsReportDetail["fights"],
    zone: expandMeta ? (r.zone as FFLogsReportDetail["zone"]) : undefined,
    region: expandMeta ? (r.region as FFLogsReportDetail["region"]) : undefined,
    guild: expandMeta ? (r.guild as FFLogsReportDetail["guild"]) : undefined,
    guildTag: expandMeta ? (r.guildTag as FFLogsReportDetail["guildTag"]) : undefined,
    visibility: expandMeta ? (r.visibility as string) : undefined,
    revision: expandMeta ? (r.revision as number) : undefined,
    segments: expandMeta ? (r.segments as number) : undefined,
    exportedSegments: expandMeta ? (r.exportedSegments as number) : undefined,
    archiveStatus: expandMeta ? (r.archiveStatus as FFLogsReportDetail["archiveStatus"]) : undefined,
    phases: expandMeta ? (r.phases as FFLogsReportDetail["phases"]) : undefined,
    rankedCharacters: expandMeta ? (r.rankedCharacters as FFLogsReportDetail["rankedCharacters"]) : undefined,
  };
}

/**
 * Fetch report table (parse/DPS table). dataType: Summary, DamageDone, Healing, Deaths, etc.
 */
export async function fetchReportTable(
  accessToken: string,
  reportCode: string,
  options?: ReportTableOptions,
): Promise<{ data: unknown }> {
  const fightIDs = options?.fightIDs ?? [];
  const startTime = options?.startTime;
  const endTime = options?.endTime;
  const hasFightIDs = fightIDs.length > 0;
  const hasTimeRange = startTime != null && endTime != null;
  if (!hasFightIDs && !hasTimeRange) {
    throw new Error("You must either provide fightIDs, or provide startTime and endTime, or both. Use the fights query to obtain the time ranges of each fight.");
  }
  const dataType = options?.dataType ?? "Summary";
  const viewBy = options?.viewBy ?? "Source";
  const query = `
    query($code: String!, $fightIDs: [Int], $dataType: TableDataType, $viewBy: ViewType, $startTime: Float, $endTime: Float) {
      reportData {
        report(code: $code) {
          table(fightIDs: $fightIDs, dataType: $dataType, viewBy: $viewBy, startTime: $startTime, endTime: $endTime)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: { report?: { table?: unknown } };
  }>(accessToken, query, {
    code: reportCode,
    fightIDs: hasFightIDs ? fightIDs : undefined,
    dataType,
    viewBy,
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
  });
  const table = data.reportData?.report?.table;
  if (table == null) {
    throw new Error("FFLogs report table not found");
  }
  const payload = typeof table === "object" && table !== null && "data" in table ? (table as { data: unknown }).data : table;
  return { data: payload };
}

/**
 * Fetch report graph (time-series, e.g. DPS over time).
 */
export async function fetchReportGraph(
  accessToken: string,
  reportCode: string,
  options?: ReportGraphOptions,
): Promise<{ data: unknown }> {
  const fightIDs = options?.fightIDs ?? [];
  const startTime = options?.startTime;
  const endTime = options?.endTime;
  const hasFightIDs = fightIDs.length > 0;
  const hasTimeRange = startTime != null && endTime != null;
  if (!hasFightIDs && !hasTimeRange) {
    throw new Error("You must either provide fightIDs, or provide startTime and endTime, or both. Use the fights query to obtain the time ranges of each fight.");
  }
  const dataType = options?.dataType ?? "Summary";
  const viewBy = options?.viewBy ?? "Source";
  const query = `
    query($code: String!, $fightIDs: [Int], $dataType: GraphDataType, $viewBy: ViewType, $startTime: Float, $endTime: Float) {
      reportData {
        report(code: $code) {
          graph(fightIDs: $fightIDs, dataType: $dataType, viewBy: $viewBy, startTime: $startTime, endTime: $endTime)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: { report?: { graph?: unknown } };
  }>(accessToken, query, {
    code: reportCode,
    fightIDs: hasFightIDs ? fightIDs : undefined,
    dataType,
    viewBy,
    startTime: startTime ?? undefined,
    endTime: endTime ?? undefined,
  });
  const graph = data.reportData?.report?.graph;
  if (graph == null) {
    throw new Error("FFLogs report graph not found");
  }
  const payload = typeof graph === "object" && graph !== null && "data" in graph ? (graph as { data: unknown }).data : graph;
  return { data: payload };
}

/**
 * Fetch report rankings (parse/rank info per player per fight).
 * rankings is JSON scalar — no sub-selection.
 */
export async function fetchReportRankings(
  accessToken: string,
  reportCode: string,
  options?: ReportRankingsOptions,
): Promise<unknown> {
  const fightIDs = options?.fightIDs ?? [];
  const query = `
    query($code: String!, $fightIDs: [Int], $compare: RankingCompareType, $playerMetric: ReportRankingMetricType, $timeframe: RankingTimeframeType) {
      reportData {
        report(code: $code) {
          rankings(fightIDs: $fightIDs, compare: $compare, playerMetric: $playerMetric, timeframe: $timeframe)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: { report?: { rankings?: unknown } };
  }>(accessToken, query, {
    code: reportCode,
    fightIDs: fightIDs.length ? fightIDs : undefined,
    compare: options?.compare ?? undefined,
    playerMetric: options?.playerMetric ?? undefined,
    timeframe: options?.timeframe ?? undefined,
  });
  const rankings = data.reportData?.report?.rankings;
  if (rankings == null) {
    throw new Error("FFLogs report rankings not found");
  }
  return typeof rankings === "object" && rankings !== null && "data" in rankings ? (rankings as { data: unknown }).data : rankings;
}

/**
 * Fetch report player details (specs, talents, optional gear).
 * playerDetails is JSON scalar — no sub-selection.
 */
export async function fetchReportPlayerDetails(
  accessToken: string,
  reportCode: string,
  options?: ReportPlayerDetailsOptions,
): Promise<unknown> {
  const fightIDs = options?.fightIDs ?? [];
  const query = `
    query($code: String!, $fightIDs: [Int], $includeCombatantInfo: Boolean) {
      reportData {
        report(code: $code) {
          playerDetails(fightIDs: $fightIDs, includeCombatantInfo: $includeCombatantInfo)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: { report?: { playerDetails?: unknown } };
  }>(accessToken, query, {
    code: reportCode,
    fightIDs: fightIDs.length ? fightIDs : undefined,
    includeCombatantInfo: options?.includeCombatantInfo ?? false,
  });
  const playerDetails = data.reportData?.report?.playerDetails;
  if (playerDetails == null) {
    throw new Error("FFLogs report playerDetails not found");
  }
  return typeof playerDetails === "object" && playerDetails !== null && "data" in playerDetails ? (playerDetails as { data: unknown }).data : playerDetails;
}

/**
 * Fetch report events (paginated raw combat log).
 */
export async function fetchReportEvents(
  accessToken: string,
  reportCode: string,
  options?: ReportEventsOptions,
): Promise<{ data: unknown[]; nextPageTimestamp?: number }> {
  const fightIDs = options?.fightIDs ?? [];
  const limit = Math.min(Math.max(options?.limit ?? 300, 100), 10000);
  const query = `
    query($code: String!, $fightIDs: [Int], $limit: Int, $startTime: Float, $endTime: Float) {
      reportData {
        report(code: $code) {
          events(fightIDs: $fightIDs, limit: $limit, startTime: $startTime, endTime: $endTime) {
            data
            nextPageTimestamp
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: {
      report?: { events?: { data: unknown[]; nextPageTimestamp?: number } };
    };
  }>(accessToken, query, {
    code: reportCode,
    fightIDs: fightIDs.length ? fightIDs : undefined,
    limit,
    startTime: options?.startTime,
    endTime: options?.endTime,
  });
  const events = data.reportData?.report?.events;
  if (!events) {
    throw new Error("FFLogs report events not found");
  }
  return {
    data: events.data ?? [],
    nextPageTimestamp: events.nextPageTimestamp,
  };
}

/**
 * Fetch report master data (actors, abilities).
 * actors and abilities are [ReportActor] and [ReportAbility] — require sub-selection.
 */
export async function fetchReportMasterData(
  accessToken: string,
  reportCode: string,
  options?: { translate?: boolean },
): Promise<unknown> {
  const translate = options?.translate !== false;
  const query = `
    query($code: String!, $translate: Boolean) {
      reportData {
        report(code: $code) {
          masterData(translate: $translate) {
            actors {
              id
              name
              gameID
              type
              subType
              server
              icon
              petOwner
            }
            abilities {
              gameID
              icon
              name
              type
            }
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    reportData?: {
      report?: {
        masterData?: {
          actors?: Array<{ id?: number; name?: string; gameID?: number; type?: string; subType?: string; server?: string; icon?: string; petOwner?: number }>;
          abilities?: Array<{ gameID?: number; icon?: string; name?: string; type?: number }>;
        };
      };
    };
  }>(accessToken, query, { code: reportCode, translate });
  const masterData = data.reportData?.report?.masterData;
  if (!masterData) {
    throw new Error("FFLogs report masterData not found");
  }
  return { actors: masterData.actors ?? [], abilities: masterData.abilities ?? [] };
}

// ---------------------------------------------------------------------------
// characterData, guildData, worldData, gameData, rateLimitData, progressRaceData
// ---------------------------------------------------------------------------

/** Character lookup: id OR (name + serverSlug + serverRegion) OR lodestoneID */
export type CharacterLookupOptions =
  | { id: number }
  | { name: string; serverSlug: string; serverRegion: string }
  | { lodestoneID: number };

export async function fetchCharacter(
  accessToken: string,
  options: CharacterLookupOptions,
): Promise<unknown> {
  const query = `
    query($id: Int, $name: String, $serverSlug: String, $serverRegion: String, $lodestoneID: Int) {
      characterData {
        character(id: $id, name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion, lodestoneID: $lodestoneID) {
          id
          name
          server { id slug region { id name slug } }
        }
      }
    }
  `;
  const variables: Record<string, unknown> = {};
  if ("id" in options) variables.id = options.id;
  if ("name" in options) {
    variables.name = options.name;
    variables.serverSlug = options.serverSlug;
    variables.serverRegion = options.serverRegion;
  }
  if ("lodestoneID" in options) variables.lodestoneID = options.lodestoneID;
  const data = await graphqlRequest<{ characterData?: { character?: unknown } }>(
    accessToken,
    query,
    variables,
  );
  return data.characterData?.character ?? null;
}

export async function fetchGuildCharacters(
  accessToken: string,
  guildID: number,
  options?: { limit?: number; page?: number },
): Promise<{ data: unknown[] }> {
  const limit = options?.limit ?? 100;
  const page = options?.page ?? 1;
  const query = `
    query($guildID: Int!, $limit: Int!, $page: Int!) {
      characterData {
        characters(guildID: $guildID, limit: $limit, page: $page) {
          data {
            id
            name
            server { slug region { name } }
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    characterData?: { characters?: { data: unknown[] } };
  }>(accessToken, query, { guildID, limit, page });
  const chars = data.characterData?.characters;
  return { data: chars?.data ?? [] };
}

/** Recent reports for a character (Character.recentReports). */
export async function fetchCharacterRecentReports(
  accessToken: string,
  characterId: number,
  options?: { limit?: number; page?: number },
): Promise<{ data: unknown[]; hasMorePages?: boolean }> {
  const limit = Math.min(Math.max(options?.limit ?? 10, 1), 100);
  const page = options?.page ?? 1;
  const query = `
    query($id: Int!, $limit: Int!, $page: Int!) {
      characterData {
        character(id: $id) {
          recentReports(limit: $limit, page: $page) {
            data { code title startTime endTime }
            has_more_pages
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    characterData?: {
      character?: {
        recentReports?: { data: unknown[]; has_more_pages?: boolean };
      };
    };
  }>(accessToken, query, { id: characterId, limit, page });
  const reports = data.characterData?.character?.recentReports;
  if (!reports) return { data: [] };
  return {
    data: reports.data ?? [],
    hasMorePages: reports.has_more_pages,
  };
}

/** Zone rankings for a character (Character.zoneRankings). */
export async function fetchCharacterZoneRankings(
  accessToken: string,
  characterId: number,
  zoneId: number,
  options?: { metric?: string; partition?: number; size?: number },
): Promise<unknown> {
  const query = `
    query($id: Int!, $zoneID: Int, $metric: CharacterRankingMetricType, $partition: Int, $size: Int) {
      characterData {
        character(id: $id) {
          zoneRankings(zoneID: $zoneID, metric: $metric, partition: $partition, size: $size) {
            data
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    characterData?: {
      character?: { zoneRankings?: { data: unknown } };
    };
  }>(accessToken, query, {
    id: characterId,
    zoneID: zoneId,
    metric: options?.metric,
    partition: options?.partition,
    size: options?.size,
  });
  const rankings = data.characterData?.character?.zoneRankings;
  return rankings?.data ?? null;
}

/** Cached Lodestone-derived gear/job data for a character (Character.gameData). */
export async function fetchCharacterGameData(
  accessToken: string,
  characterId: number,
  options?: { specID?: number; forceUpdate?: boolean },
): Promise<unknown> {
  const query = `
    query($id: Int!, $specID: Int, $forceUpdate: Boolean) {
      characterData {
        character(id: $id) {
          gameData(specID: $specID, forceUpdate: $forceUpdate)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    characterData?: { character?: { gameData?: unknown } };
  }>(accessToken, query, {
    id: characterId,
    specID: options?.specID ?? null,
    forceUpdate: options?.forceUpdate ?? false,
  });
  return data.characterData?.character?.gameData ?? null;
}

/** Parse history for a single boss (Character.encounterRankings). */
export async function fetchCharacterEncounterRankings(
  accessToken: string,
  characterId: number,
  encounterId: number,
  options?: { metric?: string; partition?: number; size?: number },
): Promise<unknown> {
  const query = `
    query($id: Int!, $encounterID: Int!, $metric: CharacterRankingMetricType, $partition: Int, $size: Int) {
      characterData {
        character(id: $id) {
          encounterRankings(encounterID: $encounterID, metric: $metric, partition: $partition, size: $size)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    characterData?: { character?: { encounterRankings?: unknown } };
  }>(accessToken, query, {
    id: characterId,
    encounterID: encounterId,
    metric: options?.metric ?? null,
    partition: options?.partition ?? null,
    size: options?.size ?? null,
  });
  return data.characterData?.character?.encounterRankings ?? null;
}

/** Guild lookup: id OR (name + serverSlug + serverRegion) */
export type GuildLookupOptions =
  | { id: number }
  | { name: string; serverSlug: string; serverRegion: string };

export async function fetchGuild(
  accessToken: string,
  options: GuildLookupOptions,
): Promise<unknown> {
  const query = `
    query($id: Int, $name: String, $serverSlug: String, $serverRegion: String) {
      guildData {
        guild(id: $id, name: $name, serverSlug: $serverSlug, serverRegion: $serverRegion) {
          id
          name
          server { id slug }
          region { id name }
        }
      }
    }
  `;
  const variables: Record<string, unknown> = {};
  if ("id" in options) variables.id = options.id;
  if ("name" in options) {
    variables.name = options.name;
    variables.serverSlug = options.serverSlug;
    variables.serverRegion = options.serverRegion;
  }
  const data = await graphqlRequest<{ guildData?: { guild?: unknown } }>(
    accessToken,
    query,
    variables,
  );
  return data.guildData?.guild ?? null;
}

/** Current user's rank in a guild (Guild.currentUserRank). Requires view-user-profile scope. */
export async function fetchGuildCurrentUserRank(
  accessToken: string,
  guildId: number,
): Promise<unknown> {
  const query = `
    query($id: Int!) {
      guildData {
        guild(id: $id) {
          id
          name
          currentUserRank
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    guildData?: { guild?: { id?: number; name?: string; currentUserRank?: unknown } };
  }>(accessToken, query, { id: guildId });
  const guild = data.guildData?.guild;
  return guild ? { id: guild.id, name: guild.name, currentUserRank: guild.currentUserRank } : null;
}

export async function fetchGuilds(
  accessToken: string,
  options?: { limit?: number; page?: number; serverID?: number; serverSlug?: string; serverRegion?: string },
): Promise<{ data: unknown[] }> {
  const limit = options?.limit ?? 100;
  const page = options?.page ?? 1;
  const query = `
    query($limit: Int!, $page: Int!, $serverID: Int, $serverSlug: String, $serverRegion: String) {
      guildData {
        guilds(limit: $limit, page: $page, serverID: $serverID, serverSlug: $serverSlug, serverRegion: $serverRegion) {
          data {
            id
            name
            server { slug }
            region { name }
          }
        }
      }
    }
  `;
  const variables: Record<string, unknown> = { limit, page };
  if (options?.serverID != null) variables.serverID = options.serverID;
  if (options?.serverSlug != null) variables.serverSlug = options.serverSlug;
  if (options?.serverRegion != null) variables.serverRegion = options.serverRegion;
  const data = await graphqlRequest<{
    guildData?: { guilds?: { data: unknown[] } };
  }>(accessToken, query, variables);
  const guilds = data.guildData?.guilds;
  return { data: guilds?.data ?? [] };
}

/** Guild attendance (Guild.attendance). */
export async function fetchGuildAttendance(
  accessToken: string,
  guildId: number,
  options?: { guildTagID?: number; limit?: number; page?: number; zoneID?: number },
): Promise<unknown> {
  const limit = Math.min(Math.max(options?.limit ?? 16, 1), 25);
  const page = options?.page ?? 1;
  const query = `
    query($id: Int!, $guildTagID: Int, $limit: Int!, $page: Int!, $zoneID: Int) {
      guildData {
        guild(id: $id) {
          attendance(guildTagID: $guildTagID, limit: $limit, page: $page, zoneID: $zoneID) {
            data
            has_more_pages
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    guildData?: {
      guild?: { attendance?: { data: unknown; has_more_pages?: boolean } };
    };
  }>(accessToken, query, {
    id: guildId,
    guildTagID: options?.guildTagID,
    limit,
    page,
    zoneID: options?.zoneID,
  });
  return data.guildData?.guild?.attendance ?? null;
}

/** Guild zone ranking (Guild.zoneRanking). */
export async function fetchGuildZoneRanking(
  accessToken: string,
  guildId: number,
  zoneId?: number,
): Promise<unknown> {
  const query = `
    query($id: Int!, $zoneId: Int) {
      guildData {
        guild(id: $id) {
          zoneRanking(zoneId: $zoneId) {
            progress { encounterCount }
            rank
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    guildData?: { guild?: { zoneRanking?: unknown } };
  }>(accessToken, query, { id: guildId, zoneId: zoneId ?? null });
  return data.guildData?.guild?.zoneRanking ?? null;
}

/** World data (zones, encounters, expansions, regions, servers) - same endpoint with token */
export async function fetchZones(accessToken: string, expansionId?: number): Promise<unknown[]> {
  const query = expansionId != null
    ? `query($expansion_id: Int) { worldData { zones(expansion_id: $expansion_id) { id name } } }`
    : `query { worldData { zones { id name } } }`;
  const variables = expansionId != null ? { expansion_id: expansionId } : {};
  const data = await graphqlRequest<{ worldData?: { zones?: unknown[] } }>(
    accessToken,
    query,
    variables,
  );
  return data.worldData?.zones ?? [];
}

export async function fetchZone(accessToken: string, id: number): Promise<unknown> {
  const query = `query($id: Int!) { worldData { zone(id: $id) { id name } } }`;
  const data = await graphqlRequest<{ worldData?: { zone?: unknown } }>(
    accessToken,
    query,
    { id },
  );
  return data.worldData?.zone ?? null;
}

/** Zone with encounters, difficulties, partitions, expansion, frozen (for zone detail / tier browser). */
export async function fetchZoneDetail(accessToken: string, id: number): Promise<unknown> {
  const query = `
    query($id: Int!) {
      worldData {
        zone(id: $id) {
          id
          name
          frozen
          expansion { id name }
          encounters { id name }
          difficulties { id name }
          partitions { id name }
        }
      }
    }
  `;
  const data = await graphqlRequest<{ worldData?: { zone?: unknown } }>(
    accessToken,
    query,
    { id },
  );
  return data.worldData?.zone ?? null;
}

/** Single expansion with zones (for "zones by expansion" browser). */
export async function fetchExpansion(accessToken: string, expansionId: number): Promise<unknown> {
  const query = `
    query($id: Int!) {
      worldData {
        expansion(id: $id) {
          id
          name
          zones { id name }
        }
      }
    }
  `;
  const data = await graphqlRequest<{ worldData?: { expansion?: unknown } }>(
    accessToken,
    query,
    { id: expansionId },
  );
  return data.worldData?.expansion ?? null;
}

export async function fetchEncounter(accessToken: string, id: number): Promise<unknown> {
  const query = `query($id: Int!) { worldData { encounter(id: $id) { id name } } }`;
  const data = await graphqlRequest<{ worldData?: { encounter?: unknown } }>(
    accessToken,
    query,
    { id },
  );
  return data.worldData?.encounter ?? null;
}

/** Public leaderboard: character rankings for an encounter (Encounter.characterRankings). */
export async function fetchEncounterCharacterRankings(
  accessToken: string,
  encounterId: number,
  options?: { page?: number; serverRegion?: string; serverSlug?: string; metric?: string },
): Promise<unknown> {
  const page = options?.page ?? 1;
  const query = `
    query($id: Int!, $page: Int, $serverRegion: String, $serverSlug: String, $metric: CharacterRankingMetricType) {
      worldData {
        encounter(id: $id) {
          id
          name
          characterRankings(page: $page, serverRegion: $serverRegion, serverSlug: $serverSlug, metric: $metric)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    worldData?: { encounter?: { id?: number; name?: string; characterRankings?: unknown } };
  }>(accessToken, query, {
    id: encounterId,
    page,
    serverRegion: options?.serverRegion ?? null,
    serverSlug: options?.serverSlug ?? null,
    metric: options?.metric ?? null,
  });
  return data.worldData?.encounter ?? null;
}

/** Public leaderboard: fight/speed rankings for an encounter (Encounter.fightRankings). */
export async function fetchEncounterFightRankings(
  accessToken: string,
  encounterId: number,
  options?: { page?: number; serverRegion?: string; serverSlug?: string },
): Promise<unknown> {
  const page = options?.page ?? 1;
  const query = `
    query($id: Int!, $page: Int, $serverRegion: String, $serverSlug: String) {
      worldData {
        encounter(id: $id) {
          id
          name
          fightRankings(page: $page, serverRegion: $serverRegion, serverSlug: $serverSlug)
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    worldData?: { encounter?: { id?: number; name?: string; fightRankings?: unknown } };
  }>(accessToken, query, {
    id: encounterId,
    page,
    serverRegion: options?.serverRegion ?? null,
    serverSlug: options?.serverSlug ?? null,
  });
  return data.worldData?.encounter ?? null;
}

export async function fetchExpansions(accessToken: string): Promise<unknown[]> {
  const query = `query { worldData { expansions { id name } } }`;
  const data = await graphqlRequest<{ worldData?: { expansions?: unknown[] } }>(
    accessToken,
    query,
    {},
  );
  return data.worldData?.expansions ?? [];
}

export async function fetchRegions(accessToken: string): Promise<unknown[]> {
  const query = `query { worldData { regions { id name slug } } }`;
  const data = await graphqlRequest<{ worldData?: { regions?: unknown[] } }>(
    accessToken,
    query,
    {},
  );
  return data.worldData?.regions ?? [];
}

export async function fetchServer(
  accessToken: string,
  options: { id?: number; region?: string; slug?: string },
): Promise<unknown> {
  const query = `query($id: Int, $region: String, $slug: String) { worldData { server(id: $id, region: $region, slug: $slug) { id name slug region { slug } } } }`;
  const data = await graphqlRequest<{ worldData?: { server?: unknown } }>(
    accessToken,
    query,
    { id: options.id, region: options.region, slug: options.slug },
  );
  return data.worldData?.server ?? null;
}

/** Servers in a region (for dropdowns). Uses worldData.region(id).servers(limit, page). */
export async function fetchServersByRegion(
  accessToken: string,
  regionId: number,
  options?: { limit?: number; page?: number },
): Promise<{ data: unknown[] }> {
  const limit = options?.limit ?? 500;
  const page = options?.page ?? 1;
  const query = `
    query($regionId: Int!, $limit: Int!, $page: Int!) {
      worldData {
        region(id: $regionId) {
          servers(limit: $limit, page: $page) {
            data { id name slug }
          }
        }
      }
    }
  `;
  const data = await graphqlRequest<{
    worldData?: { region?: { servers?: { data: unknown[] } } };
  }>(accessToken, query, { regionId, limit, page });
  const servers = data.worldData?.region?.servers?.data ?? [];
  return { data: servers };
}

/** Game data (classes, abilities) */
export async function fetchClasses(
  accessToken: string,
  options?: { zoneId?: number; factionId?: number },
): Promise<unknown[]> {
  const query = `query($zone_id: Int, $faction_id: Int) { gameData { classes(zone_id: $zone_id, faction_id: $faction_id) { id name slug } } }`;
  const data = await graphqlRequest<{ gameData?: { classes?: unknown[] } }>(
    accessToken,
    query,
    { zone_id: options?.zoneId, faction_id: options?.factionId },
  );
  return data.gameData?.classes ?? [];
}

export async function fetchClass(accessToken: string, id: number): Promise<unknown> {
  const query = `query($id: Int!) { gameData { class(id: $id) { id name slug } } }`;
  const data = await graphqlRequest<{ gameData?: { class?: unknown } }>(
    accessToken,
    query,
    { id },
  );
  return data.gameData?.class ?? null;
}

export async function fetchAbilities(
  accessToken: string,
  options?: { limit?: number; page?: number },
): Promise<{ data: unknown[] }> {
  const limit = options?.limit ?? 100;
  const page = options?.page ?? 1;
  const query = `query($limit: Int!, $page: Int!) { gameData { abilities(limit: $limit, page: $page) { data { id name } } } }`;
  const data = await graphqlRequest<{
    gameData?: { abilities?: { data: unknown[] } };
  }>(accessToken, query, { limit, page });
  return { data: data.gameData?.abilities?.data ?? [] };
}

export async function fetchAbility(accessToken: string, id: number): Promise<unknown> {
  const query = `query($id: Int!) { gameData { ability(id: $id) { id name } } }`;
  const data = await graphqlRequest<{ gameData?: { ability?: unknown } }>(
    accessToken,
    query,
    { id },
  );
  return data.gameData?.ability ?? null;
}

/** All factions (for class browser / faction filter). */
export async function fetchFactions(accessToken: string): Promise<unknown[]> {
  const query = `query { gameData { factions { id name } } }`;
  const data = await graphqlRequest<{ gameData?: { factions?: unknown[] } }>(
    accessToken,
    query,
    {},
  );
  return data.gameData?.factions ?? [];
}

export async function fetchRateLimitData(accessToken: string): Promise<unknown> {
  const query = `query { rateLimitData { limitPerHour pointsSpentThisHour pointsResetIn } }`;
  const data = await graphqlRequest<{ rateLimitData?: unknown }>(accessToken, query, {});
  return data.rateLimitData ?? null;
}

export async function fetchProgressRaceData(accessToken: string): Promise<unknown> {
  const query = `query { progressRaceData { worldFirst { guild { name } } realmFirst { guild { name } } } }`;
  try {
    const data = await graphqlRequest<{ progressRaceData?: unknown }>(accessToken, query, {});
    return data.progressRaceData ?? null;
  } catch {
    return null;
  }
}

/** Options for progressRaceData.progressRace (world-race leaderboard). All optional. */
export type ProgressRaceOptions = {
  serverRegion?: string;
  serverSubregion?: string;
  serverSlug?: string;
  zoneID?: number;
  competitionID?: number;
  difficulty?: number;
  size?: number;
  guildID?: number;
  guildName?: string;
};

/** Full progress race data (JSON); only active when a race is ongoing. Updates every 30s. */
export async function fetchProgressRace(
  accessToken: string,
  options?: ProgressRaceOptions,
): Promise<unknown> {
  const vars = options ?? {};
  const query = `
    query(
      $serverRegion: String,
      $serverSubregion: String,
      $serverSlug: String,
      $zoneID: Int,
      $competitionID: Int,
      $difficulty: Int,
      $size: Int,
      $guildID: Int,
      $guildName: String
    ) {
      progressRaceData {
        progressRace(
          serverRegion: $serverRegion,
          serverSubregion: $serverSubregion,
          serverSlug: $serverSlug,
          zoneID: $zoneID,
          competitionID: $competitionID,
          difficulty: $difficulty,
          size: $size,
          guildID: $guildID,
          guildName: $guildName
        )
      }
    }
  `;
  try {
    const data = await graphqlRequest<{ progressRaceData?: { progressRace?: unknown } }>(
      accessToken,
      query,
      vars,
    );
    return data.progressRaceData?.progressRace ?? null;
  } catch {
    return null;
  }
}

/** Options for progressRaceData.detailedComposition (raid comp for a guild in the race). */
export type ProgressRaceCompositionOptions = {
  competitionID?: number;
  guildID?: number;
  guildName?: string;
  serverSlug?: string;
  serverRegion?: string;
  encounterID?: number;
  difficulty?: number;
  size?: number;
};

/** Detailed composition for a guild in the progress race (JSON). */
export async function fetchProgressRaceDetailedComposition(
  accessToken: string,
  options?: ProgressRaceCompositionOptions,
): Promise<unknown> {
  const vars = options ?? {};
  const query = `
    query(
      $competitionID: Int,
      $guildID: Int,
      $guildName: String,
      $serverSlug: String,
      $serverRegion: String,
      $encounterID: Int,
      $difficulty: Int,
      $size: Int
    ) {
      progressRaceData {
        detailedComposition(
          competitionID: $competitionID,
          guildID: $guildID,
          guildName: $guildName,
          serverSlug: $serverSlug,
          serverRegion: $serverRegion,
          encounterID: $encounterID,
          difficulty: $difficulty,
          size: $size
        )
      }
    }
  `;
  try {
    const data = await graphqlRequest<{
      progressRaceData?: { detailedComposition?: unknown };
    }>(accessToken, query, vars);
    return data.progressRaceData?.detailedComposition ?? null;
  } catch {
    return null;
  }
}

/**
 * Generate PKCE code_verifier and code_challenge (S256).
 * Store code_verifier in a cookie/session keyed by state; send code_challenge in authorize URL.
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(64).toString("base64url");
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return { codeVerifier, codeChallenge };
}

export { FFLOGS_AUTHORIZE_URL };
