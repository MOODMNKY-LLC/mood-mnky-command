"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FragranceOil } from "@/lib/types";
import { FAMILY_COLORS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DojoOilPickerProps {
  oils: FragranceOil[];
  value: string | null;
  onChange: (oilId: string) => void;
  usedOilIds: string[];
  disabled?: boolean;
  placeholder?: string;
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function DojoOilPicker({
  oils,
  value,
  onChange,
  usedOilIds,
  disabled = false,
  placeholder = "Search or choose fragrance...",
}: DojoOilPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOils = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return oils.filter((o) => !usedOilIds.includes(o.id) || o.id === value);
    }
    const escaped = escapeRegex(q);
    const re = new RegExp(escaped, "i");
    return oils.filter(
      (o) =>
        (!usedOilIds.includes(o.id) || o.id === value) &&
        (re.test(o.name) ||
          re.test(o.family) ||
          o.topNotes.some((n) => re.test(n)) ||
          o.middleNotes.some((n) => re.test(n)) ||
          o.baseNotes.some((n) => re.test(n)) ||
          o.subfamilies?.some((f) => re.test(f)) ||
          re.test(o.description || ""))
    );
  }, [oils, usedOilIds, value, search]);

  const selectedOil = oils.find((o) => o.id === value);
  const imageUrl = selectedOil?.thumbnailUrl ?? selectedOil?.imageUrl;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-9 min-h-0 w-full justify-between gap-1.5 px-2.5 py-1.5 text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {selectedOil ? (
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              {imageUrl ? (
                <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded border border-border">
                  <img
                    src={imageUrl}
                    alt={selectedOil.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <span
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: FAMILY_COLORS[selectedOil.family] }}
                />
              )}
              <span className="truncate text-xs">{selectedOil.name}</span>
              <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">({selectedOil.type})</span>
            </span>
          ) : (
            <span className="flex-1 truncate text-xs">{placeholder}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, family, or notes..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No fragrance found.</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[260px]">
                <div className="p-1">
                  {filteredOils.map((oil) => {
                    const img = oil.thumbnailUrl ?? oil.imageUrl;
                    return (
                      <CommandItem
                        key={oil.id}
                        value={oil.id}
                        onSelect={() => {
                          onChange(oil.id);
                          setOpen(false);
                          setSearch("");
                        }}
                        className="flex items-center gap-3 py-2"
                      >
                        {img ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-border">
                            <img
                              src={img}
                              alt={oil.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <span
                            className="inline-block size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: FAMILY_COLORS[oil.family] }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{oil.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <span
                              className="inline-block size-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: FAMILY_COLORS[oil.family] }}
                            />
                            {oil.family} · {oil.type}
                            {oil.topNotes.length > 0 && (
                              <> · {oil.topNotes.slice(0, 2).join(", ")}</>
                            )}
                          </p>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
