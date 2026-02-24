"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Collection = { id: string; title: string; handle: string };

type VerseProductFiltersProps = {
  collections: Collection[];
  currentCollection?: string;
  currentTag?: string;
  currentType?: string;
  currentSort?: string;
  currentQ?: string;
};

const SORT_OPTIONS = [
  { value: "best-selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "title", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "price", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

export function VerseProductFilters({
  collections,
  currentCollection,
  currentTag,
  currentType,
  currentSort,
  currentQ,
}: VerseProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "best-selling") params.delete("sort");
    else params.set("sort", value);
    params.delete("cursor");
    const qs = params.toString();
    router.push(qs ? `/dojo/products?${qs}` : "/dojo/products");
  };

  return (
    <div className="space-y-4">
      {/* Collections pills */}
      {collections.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href={(() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete("collection");
              params.delete("cursor");
              const qs = params.toString();
              return qs ? `/dojo/products?${qs}` : "/dojo/products";
            })()}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              !currentCollection
                ? "border-verse-text/30 bg-verse-text/10 text-verse-text"
                : "border-verse-text/20 text-verse-text-muted hover:border-verse-text/30 hover:text-verse-text"
            )}
          >
            All
          </Link>
          {collections.map((col) => {
            const isActive = currentCollection === col.handle;
            const params = new URLSearchParams(searchParams.toString());
            params.set("collection", col.handle);
            params.delete("cursor");
            const href = `/dojo/products?${params.toString()}`;
            return (
              <Link
                key={col.id}
                href={href}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "border-verse-text/30 bg-verse-text/10 text-verse-text"
                    : "border-verse-text/20 text-verse-text-muted hover:border-verse-text/30 hover:text-verse-text"
                )}
              >
                {col.title}
              </Link>
            );
          })}
        </div>
      )}

      {/* Sort + Search row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          action="/dojo/products"
          method="GET"
          className="flex flex-1 gap-2 sm:max-w-xs"
        >
          {currentCollection && (
            <input type="hidden" name="collection" value={currentCollection} />
          )}
          {currentTag && <input type="hidden" name="tag" value={currentTag} />}
          {currentType && <input type="hidden" name="type" value={currentType} />}
          {currentSort && <input type="hidden" name="sort" value={currentSort} />}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-verse-text-muted" />
            <Input
              type="search"
              name="q"
              defaultValue={currentQ}
              placeholder="Search products…"
              className="pl-9 border-verse-text/20 bg-transparent text-verse-text placeholder:text-verse-text-muted"
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="border-verse-text/20 text-verse-text shrink-0"
          >
            Search
          </Button>
        </form>
        <Select
          value={currentSort ?? "best-selling"}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[200px] border-verse-text/20 text-verse-text bg-transparent">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
