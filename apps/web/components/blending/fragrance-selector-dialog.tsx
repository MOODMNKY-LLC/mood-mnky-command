"use client"

import { useState, useMemo, useCallback } from "react"
import { Search, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { FragranceWheel } from "@/components/blending/fragrance-wheel"
import type { FragranceOil, FragranceFamily } from "@/lib/types"
import {
  FRAGRANCE_FAMILIES,
  FAMILY_COLORS,
  FAMILY_KINDRED,
  FAMILY_COMPLEMENTARY,
  FAMILY_SEASONS,
  getFamilyColor,
} from "@/lib/types"
import { cn } from "@/lib/utils"

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

interface FragranceSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  oils: FragranceOil[]
  usedOilIds: string[]
  slotOilId: string | null
  onSelect: (oilId: string) => void
}

export function FragranceSelectorDialog({
  open,
  onOpenChange,
  oils,
  usedOilIds,
  slotOilId,
  onSelect,
}: FragranceSelectorDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedFamily, setSelectedFamily] = useState<FragranceFamily | null>(
    null
  )
  const [viewingOilId, setViewingOilId] = useState<string | null>(null)
  const [viewedOilIds, setViewedOilIds] = useState<string[]>([])

  const filteredOils = useMemo(() => {
    let list = oils.filter(
      (o) => !usedOilIds.includes(o.id) || o.id === slotOilId
    )
    if (selectedFamily) {
      list = list.filter(
        (o) =>
          o.family === selectedFamily ||
          (o.subfamilies ?? []).includes(selectedFamily)
      )
    }
    const q = search.trim().toLowerCase()
    if (!q) return list
    const re = new RegExp(escapeRegex(q), "i")
    return list.filter(
      (o) =>
        re.test(o.name) ||
        re.test(o.family ?? "") ||
        (o.topNotes ?? []).some((n) => re.test(n)) ||
        (o.middleNotes ?? []).some((n) => re.test(n)) ||
        (o.baseNotes ?? []).some((n) => re.test(n)) ||
        (o.subfamilies ?? []).some((f) => re.test(f)) ||
        re.test(o.description || "")
    )
  }, [oils, usedOilIds, slotOilId, selectedFamily, search])

  const viewingOil = viewingOilId
    ? oils.find((o) => o.id === viewingOilId)
    : null

  const viewedOils = useMemo(() => {
    return viewedOilIds
      .map((id) => oils.find((o) => o.id === id))
      .filter((o): o is FragranceOil => !!o)
  }, [viewedOilIds, oils])

  const handleViewOil = useCallback((oilId: string) => {
    setViewingOilId(oilId)
    setViewedOilIds((prev) => {
      const next = [oilId, ...prev.filter((id) => id !== oilId)].slice(0, 6)
      return next
    })
  }, [])

  const highlightedFamilies = useMemo((): FragranceFamily[] => {
    if (!viewingOil) return []
    const families: FragranceFamily[] = [viewingOil.family]
    const kindred = FAMILY_KINDRED[viewingOil.family] ?? []
    const complementary = FAMILY_COMPLEMENTARY[viewingOil.family]
    kindred.forEach((f) => {
      if (!families.includes(f)) families.push(f)
    })
    if (complementary && !families.includes(complementary)) {
      families.push(complementary)
    }
    return families
  }, [viewingOil])

  const handleAdd = useCallback(
    (oilId: string) => {
      onSelect(oilId)
      onOpenChange(false)
      setSearch("")
      setSelectedFamily(null)
      setViewingOilId(null)
    },
    [onSelect, onOpenChange]
  )

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setSearch("")
        setSelectedFamily(null)
        setViewingOilId(null)
        setViewedOilIds([])
      }
      onOpenChange(next)
    },
    [onOpenChange]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-left">
              Choose a Fragrance to Blend
            </DialogTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, family, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-secondary border-border"
              />
            </div>
          </div>
        </DialogHeader>

        {/* Category filters */}
        <div className="px-6 py-3 border-b border-border overflow-x-auto">
          <div className="flex flex-wrap gap-2">
            {FRAGRANCE_FAMILIES.map((family) => (
              <button
                key={family}
                type="button"
                onClick={() =>
                  setSelectedFamily((f) => (f === family ? null : family))
                }
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  selectedFamily === family
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-secondary"
                )}
                style={
                  selectedFamily !== family
                    ? { borderColor: getFamilyColor(family) }
                    : undefined
                }
              >
                {family}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {filteredOils.length} fragrance{filteredOils.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>

        {/* Body: left carousel + wheel, right list */}
        <div className="flex flex-1 min-h-[400px] flex-col lg:flex-row overflow-hidden">
          {/* Left: Carousel + Wheel */}
          <div className="flex flex-col gap-4 p-6 border-b lg:border-b-0 lg:border-r border-border lg:w-[380px] shrink-0 overflow-y-auto">
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Preview
              </span>
              {viewedOils.length > 0 ? (
                <Carousel className="w-full" opts={{ align: "start" }}>
                  <CarouselContent>
                    {viewedOils.map((oil) => (
                      <CarouselItem key={oil.id}>
                        <FragranceDetailCard oil={oil} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {viewedOils.length > 1 && (
                    <>
                      <CarouselPrevious className="-left-2" />
                      <CarouselNext className="-right-2" />
                    </>
                  )}
                </Carousel>
              ) : (
                <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30">
                  <p className="text-sm text-muted-foreground text-center px-4">
                    Select a fragrance to view details and wheel position
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Fragrance Wheel
              </span>
              <div className="scale-90 origin-top-left">
                <FragranceWheel
                  compact
                  highlightedFamilies={
                    highlightedFamilies.length > 0 ? highlightedFamilies : undefined
                  }
                />
              </div>
            </div>
          </div>

          {/* Right: Scrollable list */}
          <div className="flex flex-col flex-1 min-h-[320px] overflow-hidden">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredOils.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                    {search.trim() || selectedFamily
                      ? "No fragrances match your search. Try different filters."
                      : "All fragrances are in use or catalog is empty."}
                  </div>
                ) : (
                  filteredOils.map((oil) => {
                    const img = oil.thumbnailUrl ?? oil.imageUrl
                    const isViewing = viewingOilId === oil.id
                    return (
                      <div
                        key={oil.id}
                        onClick={() => handleViewOil(oil.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                          isViewing
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border bg-card hover:bg-secondary/50"
                        )}
                      >
                        {img ? (
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                            <img
                              src={img}
                              alt={oil.name}
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <span
                            className="inline-block h-12 w-12 shrink-0 rounded-md border border-border"
                            style={{
                              backgroundColor: `${getFamilyColor(oil.family)}30`,
                            }}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">
                            {oil.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className="inline-block size-2 rounded-full shrink-0"
                              style={{
                                backgroundColor: getFamilyColor(oil.family),
                              }}
                            />
                            {oil.family}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAdd(oil.id)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Add {oil.name}</span>
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FragranceDetailCard({ oil }: { oil: FragranceOil }) {
  const kindred = (oil.family && FAMILY_KINDRED[oil.family as FragranceFamily]) ?? []
  const complementary = oil.family ? FAMILY_COMPLEMENTARY[oil.family as FragranceFamily] : null
  const season = (oil.family && FAMILY_SEASONS[oil.family as FragranceFamily]) ?? "All Season"
  const imageUrl = oil.thumbnailUrl ?? oil.imageUrl
  const topNotes = oil.topNotes ?? []
  const middleNotes = oil.middleNotes ?? []

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex gap-3">
        {imageUrl ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border">
            <img
              src={imageUrl}
              alt={oil.name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div
            className="h-20 w-20 shrink-0 rounded-lg border border-border"
            style={{ backgroundColor: `${FAMILY_COLORS[oil.family]}20` }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground">{oil.name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                borderColor: `${getFamilyColor(oil.family)}60`,
                color: getFamilyColor(oil.family),
              }}
            >
              {oil.family}
            </Badge>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {oil.type ?? "Fragrance Oil"}
            </Badge>
          </div>
          {(oil.rating ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Rating: {oil.rating}
              {(oil.reviewCount ?? 0) > 0 && ` (${oil.reviewCount} reviews)`}
            </p>
          )}
        </div>
      </div>
      {oil.description && (
        <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
          {oil.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {topNotes.slice(0, 2).map((n) => (
          <Badge key={n} variant="outline" className="text-[10px] border-chart-1/40 text-chart-1">
            {n}
          </Badge>
        ))}
        {middleNotes.slice(0, 1).map((n) => (
          <Badge key={n} variant="outline" className="text-[10px] border-chart-2/40 text-chart-2">
            {n}
          </Badge>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">Season:</span>
        <span className="text-foreground">{season}</span>
        <span className="text-muted-foreground mx-1">|</span>
        <span className="text-muted-foreground">Kindred:</span>
        {kindred.map((f) => (
          <Badge
            key={f}
            variant="outline"
            className="text-[10px]"
            style={{
              borderColor: `${getFamilyColor(f)}50`,
              color: getFamilyColor(f),
            }}
          >
            {f}
          </Badge>
        ))}
        {complementary && (
          <>
            <span className="text-muted-foreground mx-1">|</span>
            <span className="text-muted-foreground">Complementary:</span>
            <Badge
              variant="outline"
              className="text-[10px]"
              style={{
                borderColor: `${getFamilyColor(complementary)}50`,
                color: getFamilyColor(complementary),
              }}
            >
              {complementary}
            </Badge>
          </>
        )}
      </div>
      {(oil.price1oz ?? 0) > 0 && (
        <p className="mt-2 text-sm font-mono text-foreground">
          ${(oil.price1oz ?? 0).toFixed(2)}/oz
        </p>
      )}
    </div>
  )
}
