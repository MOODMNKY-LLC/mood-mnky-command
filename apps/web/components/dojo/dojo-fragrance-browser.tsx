"use client";

import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { DojoFragranceOilCard } from "@/components/dojo/dojo-fragrance-oil-card";
import type { FragranceOil, FragranceFamily } from "@/lib/types";

interface DojoFragranceBrowserProps {
  oils: FragranceOil[];
  onSelectOil: (oil: FragranceOil) => void;
  usedOilIds: string[];
  isLoading?: boolean;
  /** Error loading catalog */
  error?: Error | { error?: string } | null;
  /** Controlled search - when provided, search is controlled by parent */
  search?: string;
  onSearchChange?: (value: string) => void;
  /** Filter by fragrance family */
  familyFilter?: FragranceFamily | null;
  /** When user clicks an oil row (preview without adding) */
  onPreviewOil?: (oil: FragranceOil) => void;
}

export function DojoFragranceBrowser({
  oils,
  onSelectOil,
  usedOilIds,
  isLoading = false,
  error: searchError,
  search: controlledSearch,
  onSearchChange,
  familyFilter = null,
  onPreviewOil,
}: DojoFragranceBrowserProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const search =
    controlledSearch !== undefined ? controlledSearch : internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;

  const filteredOils = oils.filter((o) => !usedOilIds.includes(o.id));

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
      <p className="text-xs text-muted-foreground">
        {filteredOils.length} fragrance{filteredOils.length !== 1 ? "s" : ""} found
      </p>
      <ScrollArea className="h-[320px] rounded-md border">
        <div className="space-y-2 p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Loading...
            </div>
          ) : searchError ? (
            <div className="py-8 text-center text-sm text-destructive">
              Failed to load fragrances. Please try again.
            </div>
          ) : filteredOils.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {controlledSearch?.trim() ?? search.trim()
                ? "No fragrances match your search"
                : "All oils are in use or catalog is empty"}
            </div>
          ) : (
            filteredOils.map((oil) =>
              onPreviewOil ? (
                <div key={oil.id} className="flex items-start gap-1">
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onPreviewOil(oil)}
                  >
                    <DojoFragranceOilCard oil={oil} compact />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 mt-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOil(oil);
                    }}
                    title="Add to blend"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              ) : (
                <DojoFragranceOilCard
                  key={oil.id}
                  oil={oil}
                  onSelect={onSelectOil}
                  compact
                />
              )
            )
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
