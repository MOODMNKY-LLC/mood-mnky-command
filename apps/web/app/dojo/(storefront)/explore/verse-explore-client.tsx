"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Search, BookOpen, ChevronRight, CircleDot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import { VerseButton } from "@/components/verse/ui/button";
import type { FragranceFamily } from "@/lib/types";

type FragranceNote = {
  id: string;
  name: string;
  slug: string;
  descriptionShort: string;
  olfactiveProfile: string;
  facts: string;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function VerseExploreClient() {
  const [letterFilter, setLetterFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedFamily, setSelectedFamily] =
    useState<FragranceFamily | null>(null);

  const params = new URLSearchParams();
  if (letterFilter) params.set("letter", letterFilter);
  if (search) params.set("q", search);
  const apiUrl = `/api/fragrance-notes${params.toString() ? `?${params}` : ""}`;

  const { data: listData, isLoading } = useSWR<{ notes: FragranceNote[] }>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const notes = listData?.notes ?? [];
  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.descriptionShort.toLowerCase().includes(q)
    );
  }, [notes, search]);

  return (
    <div className="space-y-6">
      {/* Fragrance Wheel preview - discover by scent family */}
      <div className="rounded-lg border border-verse-text/15 bg-verse-bg/60 p-4 [&_.fill-foreground]:fill-verse-text [&_.fill-muted-foreground]:fill-verse-text-muted [&_.text-foreground]:text-verse-text [&_.text-muted-foreground]:text-verse-text-muted [&_.bg-card]:bg-verse-bg/80 [&_.border-border]:border-verse-text/15">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-verse-heading text-sm font-semibold text-verse-text">
            Discover by Scent Family
          </h3>
          <VerseButton variant="outline" size="sm" asChild>
            <Link href="/dojo/fragrance-wheel" className="gap-1.5">
              <CircleDot className="h-4 w-4" />
              Full Wheel
            </Link>
          </VerseButton>
        </div>
        <FragranceWheel
          selectedFamily={selectedFamily}
          onSelectFamily={setSelectedFamily}
        />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-verse-text-muted" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-verse-text/20 bg-verse-bg/80 pl-9 text-verse-text placeholder:text-verse-text-muted"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setLetterFilter(null)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              letterFilter === null
                ? "bg-verse-button text-verse-button-text"
                : "bg-verse-text/10 text-verse-text-muted hover:bg-verse-text/20"
            }`}
          >
            All
          </button>
          {LETTERS.map((L) => (
            <button
              key={L}
              type="button"
              onClick={() => setLetterFilter(L)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                letterFilter === L
                  ? "bg-verse-button text-verse-button-text"
                  : "bg-verse-text/10 text-verse-text-muted hover:bg-verse-text/20"
              }`}
            >
              {L}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-verse-text/20 bg-verse-bg/30 py-16">
          <BookOpen className="mb-3 h-12 w-12 text-verse-text/40" />
          <p className="text-sm text-verse-text-muted">
            No fragrance notes found yet.
          </p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {filteredNotes.map((note) => (
            <AccordionItem
              key={note.id}
              value={note.slug}
              className="border-verse-text/15 rounded-lg border bg-verse-bg/60"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]>svg]:rotate-90">
                <div className="flex items-center gap-3">
                  <ChevronRight className="h-4 w-4 shrink-0 text-verse-button transition-transform" />
                  <span className="font-medium text-verse-text">{note.name}</span>
                  {note.descriptionShort && (
                    <div className="flex flex-wrap gap-1">
                      {note.descriptionShort
                        .split(",")
                        .slice(0, 3)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] font-normal border-verse-text/15 bg-verse-text/5 text-verse-text-muted"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pl-7">
                  {note.olfactiveProfile && (
                    <div>
                      <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                        Olfactive Profile
                      </h4>
                      <p className="text-sm leading-relaxed text-verse-text">
                        {note.olfactiveProfile}
                      </p>
                    </div>
                  )}
                  {note.facts && (
                    <div>
                      <h4 className="mb-1 text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                        Facts
                      </h4>
                      <p className="text-sm leading-relaxed text-verse-text-muted">
                        {note.facts}
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
