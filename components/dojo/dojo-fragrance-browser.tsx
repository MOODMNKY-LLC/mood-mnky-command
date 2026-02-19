"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DojoFragranceOilCard } from "@/components/dojo/dojo-fragrance-oil-card";
import type { FragranceOil } from "@/lib/types";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface DojoFragranceBrowserProps {
  oils: FragranceOil[];
  onSelectOil: (oil: FragranceOil) => void;
  usedOilIds: string[];
  isLoading?: boolean;
  /** Controlled search - when provided, search is controlled by parent */
  search?: string;
  onSearchChange?: (value: string) => void;
}

export function DojoFragranceBrowser({
  oils,
  onSelectOil,
  usedOilIds,
  isLoading = false,
  search: controlledSearch,
  onSearchChange,
}: DojoFragranceBrowserProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const search = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const filteredOils = useMemo(() => {
    const addable = oils.filter((o) => !usedOilIds.includes(o.id));
    const q = search.trim().toLowerCase();
    if (!q) return addable;
    const re = new RegExp(escapeRegex(q), "i");
    return addable.filter(
      (o) =>
        re.test(o.name) ||
        re.test(o.family) ||
        o.topNotes.some((n) => re.test(n)) ||
        o.middleNotes.some((n) => re.test(n)) ||
        o.baseNotes.some((n) => re.test(n)) ||
        o.subfamilies?.some((f) => re.test(f)) ||
        re.test(o.description || "")
    );
  }, [oils, usedOilIds, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, family, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
          disabled={isLoading}
        />
      </div>
      <ScrollArea className="h-[320px] rounded-md border">
        <div className="space-y-2 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : filteredOils.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search.trim()
                ? "No fragrances match your search"
                : "All oils are in use or catalog is empty"}
            </div>
          ) : (
            filteredOils.map((oil) => (
              <DojoFragranceOilCard
                key={oil.id}
                oil={oil}
                onSelect={onSelectOil}
                compact
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
