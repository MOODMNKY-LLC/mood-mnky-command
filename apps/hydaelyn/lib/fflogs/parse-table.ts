/**
 * Parse FFLogs report table (Summary viewBy Source) into party rollups and per-player metrics.
 * Handles both { data: { entries: [...] } } and { data: [...] } shapes.
 */

export type ParsedTablePlayer = {
  actor_id: number;
  actor_name: string | null;
  job: string | null;
  rdps: number | null;
  adps: number | null;
  ndps: number | null;
  hps: number | null;
  deaths: number | null;
  damage_taken: number | null;
};

export type ParsedTableSummary = {
  party_dps: number | null;
  party_hps: number | null;
  deaths: number | null;
  damage_taken: number | null;
  players: ParsedTablePlayer[];
};

function num(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function str(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  return null;
}

/**
 * Normalize table payload to entries array. FFLogs can return data as array or { entries: [] }.
 */
function getEntries(data: unknown): Record<string, unknown>[] {
  if (data == null) return [];
  if (Array.isArray(data)) {
    return data.filter((x): x is Record<string, unknown> => x != null && typeof x === "object");
  }
  if (typeof data === "object" && "entries" in data) {
    const entries = (data as { entries?: unknown }).entries;
    return Array.isArray(entries)
      ? entries.filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
      : [];
  }
  return [];
}

/**
 * Parse FFLogs table response (Summary, viewBy Source) into ParsedTableSummary.
 * Tolerates various field names (total, totalDamage, rdps, etc.).
 */
export function parseReportTableSummary(tablePayload: { data?: unknown }): ParsedTableSummary {
  const raw = tablePayload?.data;
  const entries = getEntries(raw);

  let party_dps: number | null = null;
  let party_hps: number | null = null;
  let deaths: number | null = null;
  let damage_taken: number | null = null;
  const players: ParsedTablePlayer[] = [];

  for (const row of entries) {
    const id = num(row.id ?? row.guid) ?? 0;
    const name = str(row.name ?? row.title);
    const job = str(row.type ?? row.job ?? row.spec);
    const total = num(row.total ?? row.totalDamage ?? row.damage);
    const rdps = num(row.rdps ?? row.rDPS);
    const adps = num(row.adps ?? row.aDPS);
    const ndps = num(row.ndps ?? row.nDPS);
    const hps = num(row.hps ?? row.healing ?? row.heal);
    const deathsCount = num(row.deaths);
    const taken = num(row.damageTaken ?? row.damage_taken);

    if (id > 0 || name || total != null || rdps != null || hps != null) {
      players.push({
        actor_id: id,
        actor_name: name,
        job,
        rdps: rdps ?? total,
        adps: adps ?? null,
        ndps: ndps ?? null,
        hps,
        deaths: deathsCount,
        damage_taken: taken,
      });
    }

    if (party_dps == null && total != null) party_dps = 0;
    if (total != null) party_dps = (party_dps ?? 0) + total;
    if (party_hps == null && hps != null) party_hps = 0;
    if (hps != null) party_hps = (party_hps ?? 0) + hps;
    if (deathsCount != null) deaths = (deaths ?? 0) + deathsCount;
    if (taken != null) damage_taken = (damage_taken ?? 0) + taken;
  }

  return {
    party_dps,
    party_hps,
    deaths,
    damage_taken,
    players,
  };
}
