/**
 * Maps FFLogs zones to duty categories (Savage, Ultimates, Trials, Raids, Dungeons).
 * Used for sidebar duty nav and filtering. Zone names from API are used for heuristics;
 * extend zoneIdCategoryMap when needed for precise mapping.
 */

import type { DutyCategory } from "@/lib/dashboard-context";

const zoneIdCategoryMap: Partial<Record<number, DutyCategory>> = {
  // Savage tiers (sync with resources/ffxiv/references/encounter-ids.json when new tiers release)
  54: "savage", // Anabaseios
  53: "savage", // Abyssos
};

export function getZoneDutyCategory(zone: { id: number; name?: string | null }): DutyCategory | null {
  const idCat = zoneIdCategoryMap[zone.id];
  if (idCat) return idCat;
  const name = (zone.name ?? "").toLowerCase();
  if (name.includes("savage") && !name.includes("criterion")) return "savage";
  if (name.includes("ultimate")) return "ultimates";
  if (name.includes("extreme") || name.includes("unreal") || name.includes("trial")) return "trials";
  if (name.includes("criterion") || name.includes("dungeon")) return "dungeons";
  if (name.includes("raid") || name.includes("normal") || name.includes("circle")) return "raids";
  return null;
}

export function filterZonesByDuty<T extends { id: number; name?: string | null }>(
  zones: T[],
  duty: DutyCategory | null
): T[] {
  if (!duty) return zones;
  return zones.filter((z) => getZoneDutyCategory(z) === duty);
}
