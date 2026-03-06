"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CombatantRow } from "../types";

type TabMode = "healing" | "tanking" | "raiding" | "aggro";

type MetricsTabProps = {
  combatants: CombatantRow[];
  mode: TabMode;
  nameBlur: boolean;
};

export function MetricsTab({ combatants, mode, nameBlur }: MetricsTabProps) {
  if (combatants.length === 0) {
    return (
      <div className="mt-3">
        <p className="text-sm text-muted-foreground">
          Awaiting encounter data…
        </p>
      </div>
    );
  }

  if (mode === "healing") {
    const hasHealing = combatants.some((r) => r.enchps != null);
    return (
      <div className="mt-3 space-y-2">
        {!hasHealing && (
          <p className="text-xs text-white/50">
            No healing data in this encounter. ENCHPS appears when ACT reports it.
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-white/80">Name</TableHead>
              <TableHead className="text-white/80">Job</TableHead>
              <TableHead className="text-white/80">HPS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combatants
              .filter((r) => r.enchps != null)
              .sort((a, b) => (b.enchps ?? 0) - (a.enchps ?? 0))
              .map((r) => (
                <TableRow key={r.name} className="border-white/20">
                  <TableCell className={nameBlur ? "blur-sm" : ""}>
                    {r.name}
                  </TableCell>
                  <TableCell className="text-white/70">{r.job}</TableCell>
                  <TableCell>
                    {Math.round(r.enchps ?? 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (mode === "tanking") {
    const hasTank = combatants.some((r) => r.damageTaken != null);
    return (
      <div className="mt-3 space-y-2">
        {!hasTank && (
          <p className="text-xs text-white/50">
            No damage-taken data in this encounter. Shown when ACT provides it.
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-white/80">Name</TableHead>
              <TableHead className="text-white/80">Job</TableHead>
              <TableHead className="text-white/80">Damage taken</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combatants
              .filter((r) => r.damageTaken != null)
              .sort((a, b) => (b.damageTaken ?? 0) - (a.damageTaken ?? 0))
              .map((r) => (
                <TableRow key={r.name} className="border-white/20">
                  <TableCell className={nameBlur ? "blur-sm" : ""}>
                    {r.name}
                  </TableCell>
                  <TableCell className="text-white/70">{r.job}</TableCell>
                  <TableCell>
                    {Math.round(r.damageTaken ?? 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (mode === "aggro") {
    const hasAggro = combatants.some((r) => r.threat != null);
    return (
      <div className="mt-3 space-y-2">
        {!hasAggro && (
          <p className="text-xs text-white/50">
            No aggro/threat data in this encounter. Shown when ACT provides it.
          </p>
        )}
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-white/80">Name</TableHead>
              <TableHead className="text-white/80">Job</TableHead>
              <TableHead className="text-white/80">Threat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combatants
              .filter((r) => r.threat != null)
              .sort((a, b) => (b.threat ?? 0) - (a.threat ?? 0))
              .map((r) => (
                <TableRow key={r.name} className="border-white/20">
                  <TableCell className={nameBlur ? "blur-sm" : ""}>
                    {r.name}
                  </TableCell>
                  <TableCell className="text-white/70">{r.job}</TableCell>
                  <TableCell>
                    {Math.round(r.threat ?? 0).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Raiding: encounter-level placeholder
  return (
    <div className="mt-3">
      <p className="text-sm text-muted-foreground">
        Raid-wide metrics (e.g. phase DPS, death count) — planned. Use Parse tab for per-player DPS.
      </p>
    </div>
  );
}
