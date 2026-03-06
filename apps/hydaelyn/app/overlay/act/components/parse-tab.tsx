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

type ParseTabProps = {
  encounterTitle: string;
  combatants: CombatantRow[];
  nameBlur: boolean;
};

export function ParseTab({ encounterTitle, combatants, nameBlur }: ParseTabProps) {
  return (
    <div className="mt-3 space-y-2">
      {encounterTitle && (
        <p className="text-sm text-muted-foreground">{encounterTitle}</p>
      )}
      {combatants.length === 0 ? (
        <p className="text-sm text-muted-foreground">Awaiting encounter data…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead className="text-white/80">Name</TableHead>
              <TableHead className="text-white/80">Job</TableHead>
              <TableHead className="text-white/80">DPS</TableHead>
              <TableHead className="text-white/80">Dmg %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combatants.map((r) => (
              <TableRow key={r.name} className="border-white/20">
                <TableCell className={nameBlur ? "blur-sm" : ""}>
                  {r.name}
                </TableCell>
                <TableCell className="text-white/70">{r.job}</TableCell>
                <TableCell>
                  {Math.round(r.encdps).toLocaleString()}
                </TableCell>
                <TableCell>{r.damagePercent.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
