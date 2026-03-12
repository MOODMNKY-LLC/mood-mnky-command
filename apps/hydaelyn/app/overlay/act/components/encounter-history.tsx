"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EncounterSnapshot } from "../types";

const MAX_ENCOUNTERS = 5;

type EncounterHistoryProps = {
  encounters: EncounterSnapshot[];
  currentIndex: number;
  onSelectIndex: (i: number) => void;
  onClear: () => void;
  onLoadSample: () => void;
};

export function EncounterHistory({
  encounters,
  currentIndex,
  onSelectIndex,
  onClear,
  onLoadSample,
}: EncounterHistoryProps) {
  const options = encounters.map((e, i) => ({
    index: i,
    label: `${e.title || "Encounter"} (${new Date(e.at).toLocaleTimeString()})`,
  }));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm text-white/70">History:</span>
      <Select
        value={currentIndex >= 0 && currentIndex < encounters.length ? String(currentIndex) : "0"}
        onValueChange={(v) => onSelectIndex(Number(v))}
      >
        <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
          <SelectValue placeholder="Select encounter" />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="0">No encounters yet</SelectItem>
          ) : (
            options.map((o) => (
              <SelectItem key={o.index} value={String(o.index)}>
                {o.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-white/20 text-white hover:bg-white/10"
        onClick={onClear}
      >
        Clear
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-white/20 text-white hover:bg-white/10"
        onClick={onLoadSample}
      >
        Load sample data
      </Button>
    </div>
  );
}

export { MAX_ENCOUNTERS };
