"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Link from "next/link"
import { Search, Loader2, BookOpen, Droplets } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { FragranceNote } from "@/lib/types"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function VerseGlossaryPage() {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [letterFilter, setLetterFilter] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const params = new URLSearchParams()
  if (letterFilter) params.set("letter", letterFilter)
  if (search) params.set("q", search)
  const apiUrl = `/api/fragrance-notes${params.toString() ? `?${params}` : ""}`

  const { data: listData, isLoading } = useSWR<{ notes: FragranceNote[] }>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )

  const { data: detailData, isLoading: detailLoading } = useSWR<{
    note: FragranceNote
    fragranceOils: Array<{
      id: string
      name: string
      family: string
      topNotes: string[]
      middleNotes: string[]
      baseNotes: string[]
    }>
  }>(
    selectedSlug ? `/api/fragrance-notes/${selectedSlug}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const notes = listData?.notes ?? []
  const selectedNote = detailData?.note ?? null
  const fragranceOils = detailData?.fragranceOils ?? []

  const filteredNotes = useMemo(() => {
    if (!search) return notes
    const q = search.toLowerCase()
    return notes.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.descriptionShort.toLowerCase().includes(q)
    )
  }, [notes, search])

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Fragrance Note Glossary
        </h1>
        <p className="mt-1 text-verse-text-muted">
          Explore fragrance notes, their olfactive profiles, and facts. Click a
          note to see fragrances that contain it.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground"
            />
          </div>
          <ScrollArea className="w-full sm:w-auto">
            <div className="flex gap-1">
              <button
                onClick={() => setLetterFilter(null)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  letterFilter === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                All
              </button>
              {LETTERS.map((L) => (
                <button
                  key={L}
                  onClick={() => setLetterFilter(L)}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    letterFilter === L
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {L}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))
          ) : filteredNotes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-16">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No fragrance notes found.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer transition-colors hover:bg-accent/50"
                onClick={() => setSelectedSlug(note.slug)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium text-verse-text">
                    {note.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {note.descriptionShort
                      .split(",")
                      .slice(0, 4)
                      .map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[10px] font-normal"
                        >
                          {tag.trim()}
                        </Badge>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Sheet
        open={!!selectedSlug}
        onOpenChange={(open) => !open && setSelectedSlug(null)}
      >
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            {detailLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : selectedNote ? (
              <SheetTitle className="text-xl text-verse-text">
                {selectedNote.name}
              </SheetTitle>
            ) : null}
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] pr-4 mt-4">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : selectedNote ? (
              <div className="space-y-6">
                {selectedNote.descriptionShort && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Description
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNote.descriptionShort
                        .split(",")
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {tag.trim()}
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
                {selectedNote.olfactiveProfile && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Olfactive Profile
                    </h4>
                    <p className="text-sm leading-relaxed text-verse-text">
                      {selectedNote.olfactiveProfile}
                    </p>
                  </div>
                )}
                {selectedNote.facts && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Facts
                    </h4>
                    <p className="text-sm leading-relaxed text-verse-text-muted">
                      {selectedNote.facts}
                    </p>
                  </div>
                )}
                {fragranceOils.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Fragrances with this note
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {fragranceOils.map((oil) => (
                        <Link
                          key={oil.id}
                          href={`/dojo/fragrance-oils?oil=${encodeURIComponent(oil.id)}`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-sm text-verse-text hover:bg-secondary transition-colors"
                          onClick={() => setSelectedSlug(null)}
                        >
                          <Droplets className="h-3.5 w-3.5 text-primary" />
                          {oil.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
