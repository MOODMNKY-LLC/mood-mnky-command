/**
 * Parse OverlayPlugin Combatant hashtable into rows for tables.
 * Supports DPS, healing, tanking, aggro columns when present.
 */

import type { CombatantRow } from "./types";

export function parseCombatants(combatant: Record<string, unknown>): CombatantRow[] {
  const totalDamage = Object.values(combatant).reduce<number>(
    (sum, c) => sum + (Number((c as Record<string, unknown>)?.damage) || 0),
    0
  );
  return Object.entries(combatant)
    .map(([name, c]) => {
      const row = c as Record<string, unknown>;
      const damage = Number(row?.damage) || 0;
      return {
        name,
        job: String(row?.Job ?? row?.job ?? ""),
        encdps: Number(row?.ENCDPS ?? row?.EncDPS ?? 0),
        damagePercent: totalDamage > 0 ? (damage / totalDamage) * 100 : 0,
        enchps: row?.ENCHPS != null ? Number(row.ENCHPS) : undefined,
        damageTaken: row?.damageTaken != null ? Number(row.damageTaken) : undefined,
        threat: row?.threat != null ? Number(row.threat) : undefined,
        raw: row,
      };
    })
    .filter((r) => r.name && !r.name.startsWith(" "))
    .sort((a, b) => b.encdps - a.encdps);
}

/** Sample CombatData for "Load sample data" testing. */
export function getSampleCombatData(): {
  Encounter: Record<string, unknown>;
  Combatant: Record<string, unknown>;
  zoneID?: number;
} {
  return {
    Encounter: {
      title: "Sample Encounter",
      duration: 120,
      ENCDPS: 12500,
    },
    Combatant: {
      "Player One": {
        name: "Player One",
        Job: "SAM",
        damage: 1500000,
        ENCDPS: 12500,
        EncDPS: 12500,
      },
      "Player Two": {
        name: "Player Two",
        Job: "BLM",
        damage: 1400000,
        ENCDPS: 11666,
        EncDPS: 11666,
      },
      "Player Three": {
        name: "Player Three",
        Job: "WHM",
        damage: 200000,
        ENCDPS: 1666,
        EncDPS: 1666,
        ENCHPS: 8000,
      },
    },
    zoneID: 0,
  };
}
