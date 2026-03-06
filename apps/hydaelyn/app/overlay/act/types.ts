/**
 * Shared types for the Hydaelyn ACT overlay (Ember-style baseline).
 * Combatant data comes from OverlayPlugin CombatData.Combatant (hashtable).
 */

export type CombatantRow = {
  name: string;
  job: string;
  encdps: number;
  damagePercent: number;
  /** Optional: healing (ENCHPS, etc.) */
  enchps?: number;
  /** Optional: damage taken */
  damageTaken?: number;
  /** Optional: threat/enmity */
  threat?: number;
  /** Raw row for extra columns */
  raw?: Record<string, unknown>;
};

export type EncounterSnapshot = {
  id: string;
  title: string;
  combatants: CombatantRow[];
  at: number;
  /** Raw Encounter + Combatant for ingest/sample */
  Encounter?: Record<string, unknown>;
  Combatant?: Record<string, unknown>;
  zoneID?: number;
};

export type OverlayTheme = "minimal" | "light" | "classic";
export type MinimizedSide = "none" | "left" | "right";
