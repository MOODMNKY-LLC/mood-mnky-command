"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Search, Loader2, Database } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { Badge } from "@/components/ui/badge"
import type { FragranceOil } from "@/lib/types"
import { FRAGRANCE_FAMILIES } from "@/lib/types"
import { FragranceCard } from "@/components/fragrances/fragrance-card"
import { FragranceDetail } from "@/components/fragrances/fragrance-detail"
import { Skeleton } from "@/components/ui/skeleton"

const categories = ["All", ...FRAGRANCE_FAMILIES]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Skeleton className="h-4 w-10" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        <Skeleton className="h-5 w-14" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  )
}

function VerseFragranceOilsContent() {
  const searchParams = useSearchParams()
  const [selectedOil, setSelectedOil] = useState<FragranceOil | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")

  const { data, isLoading } = useSWR<{ fragranceOils: FragranceOil[]; total: number }>(
    "/api/fragrance-oils",
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1, dedupingInterval: 60000 }
  )

  const sourceOils = data?.fragranceOils ?? []

  const oilIdFromUrl = searchParams.get("oil")
  useEffect(() => {
    if (oilIdFromUrl && sourceOils.length > 0) {
      const oil = sourceOils.find((o) => o.id === oilIdFromUrl)
      if (oil) setSelectedOil(oil)
    }
  }, [oilIdFromUrl, sourceOils])

  const filteredOils = useMemo(() => {
    return sourceOils.filter((oil) => {
      const matchesSearch =
        oil.name.toLowerCase().includes(search.toLowerCase()) ||
        oil.description.toLowerCase().includes(search.toLowerCase()) ||
        oil.topNotes.some((n) =>
          n.toLowerCase().includes(search.toLowerCase())
        ) ||
        oil.middleNotes.some((n) =>
          n.toLowerCase().includes(search.toLowerCase())
        ) ||
        oil.baseNotes.some((n) =>
          n.toLowerCase().includes(search.toLowerCase())
        )
      const matchesCategory =
        categoryFilter === "All" || oil.family === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [search, categoryFilter, sourceOils])

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Fragrance Oil Catalog
        </h1>
        <p className="mt-1 text-verse-text-muted">
          Browse our fragrance oil collection with notes, safety data, and pricing.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, note, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border text-foreground"
            />
          </div>
          <Tabs
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <TabsList className="bg-secondary">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat}
                  value={cat}
                  className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
                >
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative flex flex-col gap-3 lg:col-span-1">
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="flex flex-col gap-3 pr-4">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))
                ) : filteredOils.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8">
                    <p className="text-sm text-muted-foreground">
                      No fragrance oils found
                    </p>
                  </div>
                ) : (
                  filteredOils.map((oil) => (
                    <FragranceCard
                      key={oil.id}
                      oil={oil}
                      onSelect={setSelectedOil}
                      isSelected={selectedOil?.id === oil.id}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
            <ProgressiveBlur position="bottom" height="35%" />
          </div>
          <div className="lg:col-span-2">
            {selectedOil ? (
              <div className="relative">
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="pr-4">
                    <FragranceDetail oil={selectedOil} readOnly />
                  </div>
                </ScrollArea>
                <ProgressiveBlur position="bottom" height="35%" />
              </div>
            ) : (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
                <p className="text-sm text-verse-text-muted">
                  Select a fragrance oil to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerseFragranceOilsPage() {
  return (
    <Suspense
      fallback={
        <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
          <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-secondary"
                />
              ))}
            </div>
            <div className="lg:col-span-2 flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
              <p className="text-sm text-verse-text-muted">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <VerseFragranceOilsContent />
    </Suspense>
  )
}
