"use client";

import { useState, useMemo, useRef } from "react";
import useSWR from "swr";
import { X, FlaskConical, Droplets, ChevronUp, ChevronDown, Lock, LockOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatedListItemBlur } from "@/components/ui/animated-list";
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import { DojoOilPicker } from "@/components/dojo/dojo-oil-picker";
import { DojoFragranceBrowser } from "@/components/dojo/dojo-fragrance-browser";
import { BlendFragranceCard } from "@/components/dojo/blend-fragrance-card";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  ReasoningText,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  type FragranceOil,
  type ProductType,
  type FragranceFamily,
  FRAGRANCE_FAMILIES,
  PRODUCT_TYPE_LABELS,
  FAMILY_COLORS,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const BLEND_PREVIEW_CARD_HEIGHT = 760;

function BlendPreviewOneAtATime({ oils }: { oils: FragranceOil[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({
      top: direction * BLEND_PREVIEW_CARD_HEIGHT,
      behavior: "smooth",
    });
  };
  return (
    <div className="relative flex-1 min-h-[760px]">
      <div
        ref={scrollRef}
        className="h-[760px] overflow-y-auto overflow-x-hidden scroll-snap-y scroll-snap-mandatory rounded-lg"
      >
        {oils.map((oil) => (
          <div
            key={oil.id}
            className="min-h-[760px] flex-shrink-0 scroll-snap-align-start scroll-snap-stop"
          >
            <AnimatedListItemBlur>
              <BlendFragranceCard oil={oil} />
            </AnimatedListItemBlur>
          </div>
        ))}
      </div>
      {oils.length > 1 && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 !bg-transparent !border-0 hover:bg-muted/50"
            onClick={() => scroll(-1)}
            aria-label="Previous card"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 !bg-transparent !border-0 hover:bg-muted/50"
            onClick={() => scroll(1)}
            aria-label="Next card"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface BlendSlot {
  oilId: string | null;
  proportionPct: number;
  locked?: boolean;
}

export function DojoBlendingLab() {
  const [productType, setProductType] = useState<ProductType>("candle");
  const [batchWeightOz, setBatchWeightOz] = useState(14); // ~400g default
  const [blendName, setBlendName] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSuggestedName, setAiSuggestedName] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slots, setSlots] = useState<BlendSlot[]>([
    { oilId: null, proportionPct: 25, locked: false },
    { oilId: null, proportionPct: 25, locked: false },
    { oilId: null, proportionPct: 25, locked: false },
    { oilId: null, proportionPct: 25, locked: false },
  ]);
  const [browserSearch, setBrowserSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<FragranceFamily | null>(null);
  const [selectedForReview, setSelectedForReview] =
    useState<FragranceOil | null>(null);

  const debouncedSearch = useDebounce(browserSearch, 300);
  const useFullCatalog = !debouncedSearch && !familyFilter;
  const oilsUrl = useFullCatalog
    ? "/api/fragrance-oils"
    : `/api/fragrance-oils/search?q=${encodeURIComponent(debouncedSearch)}&limit=200` +
      (familyFilter ? `&family=${encodeURIComponent(familyFilter)}` : "");

  const {
    data,
    isLoading,
    error: searchError,
  } = useSWR<{ fragranceOils: FragranceOil[]; error?: string }>(
    oilsUrl,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const fragranceOils = (data?.error ? [] : data?.fragranceOils) ?? [];
  const [slotOilsCache, setSlotOilsCache] = useState<Map<string, FragranceOil>>(
    () => new Map()
  );

  // Prune cache to only oils currently in slots
  const slotOilIds = useMemo(
    () => new Set(slots.map((s) => s.oilId).filter(Boolean) as string[]),
    [slots]
  );
  const prunedCache = useMemo(() => {
    const next = new Map<string, FragranceOil>();
    for (const [id, oil] of slotOilsCache) {
      if (slotOilIds.has(id)) next.set(id, oil);
    }
    return next;
  }, [slotOilsCache, slotOilIds]);

  // Merge search results with cached slot oils (so carousel/picker have full data when slot oil isn't in current search)
  const fragranceOilsWithSlots = useMemo(() => {
    const byId = new Map(fragranceOils.map((o) => [o.id, o]));
    for (const [id, oil] of prunedCache) {
      if (!byId.has(id)) byId.set(id, oil);
    }
    return Array.from(byId.values());
  }, [fragranceOils, prunedCache]);

  // Include both Fragrance Oil and Blending Element types
  const oilsForSelect = fragranceOilsWithSlots;

  const totalPct = slots
    .filter((s) => s.oilId)
    .reduce((sum, s) => sum + s.proportionPct, 0);
  const isValid = Math.abs(totalPct - 100) < 1;

  const usedOilIds = slots.map((s) => s.oilId).filter(Boolean) as string[];

  const highlightedFamilies = useMemo((): FragranceFamily[] => {
    const families: FragranceFamily[] = [];
    for (const slot of slots) {
      if (slot.oilId) {
        const oil = fragranceOils.find((o) => o.id === slot.oilId);
        if (oil && !families.includes(oil.family)) {
          families.push(oil.family);
        }
      }
    }
    return families;
  }, [slots, fragranceOils]);

  const fragrancesForApi = useMemo(() => {
    return slots
      .filter((s) => s.oilId)
      .map((s) => {
        const oil = fragranceOils.find((o) => o.id === s.oilId!);
        return {
          oilId: s.oilId!,
          oilName: oil?.name ?? "Unknown",
          proportionPct: s.proportionPct,
          topNotes: oil?.topNotes ?? [],
          middleNotes: oil?.middleNotes ?? [],
          baseNotes: oil?.baseNotes ?? [],
        };
      });
  }, [slots, fragranceOils]);

  function redistributeProportions(s: BlendSlot[]): BlendSlot[] {
    const filled = s
      .map((slot, i) => (slot.oilId ? i : -1))
      .filter((i) => i >= 0);
    if (filled.length === 0) {
      return s.map((slot) => ({ ...slot, proportionPct: 25, locked: slot.locked ?? false }));
    }
    const lockedSum = filled.reduce(
      (sum, i) => sum + (s[i].locked ? s[i].proportionPct : 0),
      0
    );
    const unlockedFilled = filled.filter((i) => !s[i].locked);
    const remainder = 100 - lockedSum;
    if (unlockedFilled.length === 0) {
      return s.map((slot) => ({ ...slot, locked: slot.locked ?? false }));
    }
    const evenPct = Math.floor(remainder / unlockedFilled.length);
    const extra = remainder - evenPct * unlockedFilled.length;
    return s.map((slot, i) => {
      if (!slot.oilId) return { ...slot, proportionPct: 25, locked: slot.locked ?? false };
      if (slot.locked) return { ...slot, locked: true };
      const idx = unlockedFilled.indexOf(i);
      const pct = idx === unlockedFilled.length - 1 ? evenPct + extra : evenPct;
      return { ...slot, proportionPct: pct, locked: false };
    });
  }

  function updateOil(index: number, oilId: string | null) {
    setSlots((prev) => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, oilId } : s
      );
      return redistributeProportions(next);
    });
  }

  function addOilFromBrowser(oil: FragranceOil) {
    const firstEmpty = slots.findIndex((s) => !s.oilId);
    if (firstEmpty >= 0) {
      setSlotOilsCache((prev) => new Map(prev).set(oil.id, oil));
      setSlots((prev) => {
        const next = prev.map((s, i) =>
          i === firstEmpty ? { ...s, oilId: oil.id } : s
        );
        return redistributeProportions(next);
      });
      setSelectedForReview(null);
    }
  }

  function clearSlot(index: number) {
    setSlots((prev) => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, oilId: null, proportionPct: 25, locked: false } : s
      );
      return redistributeProportions(next);
    });
  }

  function toggleLock(index: number) {
    setSlots((prev) => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, locked: !(s.locked ?? false) } : s
      );
      return redistributeProportions(next);
    });
  }

  function updateProportion(index: number, value: number) {
    setSlots((prev) => {
      const filledIndices = prev
        .map((s, i) => (s.oilId ? i : -1))
        .filter((i) => i >= 0);
      if (!filledIndices.includes(index)) {
        return prev.map((s, i) =>
          i === index
            ? { ...s, proportionPct: Math.max(0, Math.min(100, Math.round(value))) }
            : s
        );
      }
      const clamped = Math.max(0, Math.min(100, Math.round(value)));
      const lockedSum = filledIndices.reduce(
        (sum, i) => sum + (i !== index && prev[i].locked ? prev[i].proportionPct : 0),
        0
      );
      const remainder = Math.max(0, 100 - clamped - lockedSum);
      const otherUnlockedFilled = filledIndices.filter(
        (i) => i !== index && !prev[i].locked
      );
      if (filledIndices.length === 1 || otherUnlockedFilled.length === 0) {
        return prev.map((s, i) =>
          i === index ? { ...s, proportionPct: clamped } : s
        );
      }
      const otherSum = otherUnlockedFilled.reduce(
        (sum, i) => sum + prev[i].proportionPct,
        0
      );

      const otherPcts: { i: number; pct: number }[] =
        otherSum === 0
          ? (() => {
              const even = Math.floor(remainder / otherUnlockedFilled.length);
              const extra = remainder - even * otherUnlockedFilled.length;
              return otherUnlockedFilled.map((i, idx) => ({
                i,
                pct:
                  idx === otherUnlockedFilled.length - 1 ? even + extra : even,
              }));
            })()
          : (() => {
              const raw = otherUnlockedFilled.map((i) => ({
                i,
                pct: Math.floor(
                  (prev[i].proportionPct / otherSum) * remainder
                ),
              }));
              const total = raw.reduce((s, x) => s + x.pct, 0);
              const diff = remainder - total;
              raw[raw.length - 1].pct += diff;
              return raw;
            })();

      return prev.map((s, i) => {
        if (i === index) return { ...s, proportionPct: clamped };
        const o = otherPcts.find((x) => x.i === i);
        return o != null ? { ...s, proportionPct: o.pct } : s;
      });
    });
  }

  async function handleDescribe() {
    if (fragrancesForApi.length === 0) return;
    setAiLoading(true);
    setAiSummary(null);
    setAiSuggestedName(null);
    try {
      const res = await fetch("/api/dojo/blends/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oils: fragrancesForApi.map((f) => ({
            oilId: f.oilId,
            oilName: f.oilName,
            proportionPct: f.proportionPct,
            topNotes: f.topNotes,
            middleNotes: f.middleNotes,
            baseNotes: f.baseNotes,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to describe blend");
      }
      const data = await res.json();
      setAiSummary(data.summary ?? "");
      setAiSuggestedName(data.suggestedName ?? null);
    } catch (e) {
      setAiSummary(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    if (!blendName.trim() || !isValid || fragrancesForApi.length === 0) return;
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await fetch("/api/blends/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blendName: blendName.trim(),
          blendSummary: {
            productType,
            fragrances: fragrancesForApi.map((f) => ({
              oilId: f.oilId,
              oilName: f.oilName,
              proportionPct: f.proportionPct,
            })),
            batchWeightG: Math.round(batchWeightOz * 28.35),
            fragranceLoadPct: 10,
            aiSummary: aiSummary ?? undefined,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save blend");
      }
      setSaveSuccess(true);
      setBlendName("");
      setAiSummary(null);
      setAiSuggestedName(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaveLoading(false);
    }
  }

  const canSave =
    blendName.trim().length > 0 && isValid && fragrancesForApi.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FlaskConical className="size-5 text-primary" />
          Blending Lab
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select up to 4 fragrance oils, set proportions (must total 100%), and get AI guidance for your blend.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid min-h-[400px] gap-6 lg:grid-cols-5">
          {/* Col 1: Browse Oils */}
          <div className="min-h-[400px] overflow-y-auto lg:col-span-1">
            <Label className="mb-2 block text-sm font-medium">Browse Oils</Label>
            <div className="mb-3 flex flex-wrap gap-2">
              {FRAGRANCE_FAMILIES.map((family) => (
                <button
                  key={family}
                  type="button"
                  onClick={() =>
                    setFamilyFilter((f) => (f === family ? null : family))
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                    familyFilter === family
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-secondary"
                  )}
                  style={
                    familyFilter !== family
                      ? { borderColor: FAMILY_COLORS[family] }
                      : undefined
                  }
                >
                  {family}
                </button>
              ))}
            </div>
            <DojoFragranceBrowser
              oils={oilsForSelect}
              onSelectOil={addOilFromBrowser}
              usedOilIds={usedOilIds}
              isLoading={isLoading}
              error={searchError || data?.error}
              search={browserSearch}
              onSearchChange={setBrowserSearch}
              familyFilter={familyFilter}
              onPreviewOil={setSelectedForReview}
            />
          </div>

          {/* Col 2: Oil Selection - 4 fixed slots */}
          <div className="min-h-[400px] space-y-2 overflow-y-auto lg:col-span-2">
            <Label className="text-sm font-medium">Oil Selection</Label>
            {slots.every((s) => !s.oilId) && (
              <p className="text-xs text-muted-foreground">
                Pick an oil from the catalog on the left to add it here. Use the
                family filters to narrow by scent type.
              </p>
            )}
            {slots.map((slot, index) => {
              const oil = slot.oilId
                ? fragranceOils.find((o) => o.id === slot.oilId)
                : null;
              const isEmpty = !slot.oilId;
              return (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col gap-2 rounded-lg p-2.5",
                    isEmpty
                      ? "border border-dashed border-border bg-muted/20"
                      : "border bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Slot {index + 1}
                    </span>
                    {!isEmpty && (
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5"
                          onClick={() => toggleLock(index)}
                          aria-label={slot.locked ? "Unlock proportion" : "Lock proportion"}
                          title={slot.locked ? "Unlock so this slot adjusts with others" : "Lock so only other slots adjust"}
                        >
                          {slot.locked ? (
                            <Lock className="size-2.5 text-primary" />
                          ) : (
                            <LockOpen className="size-2.5 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-5"
                          onClick={() => clearSlot(index)}
                        >
                          <X className="size-2.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEmpty ? (
                    <div className="flex flex-col items-center justify-center gap-0.5 py-3 text-center">
                      <Droplets className="size-5 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">
                        Pick an oil from the catalog to add here.
                      </p>
                    </div>
                  ) : (
                    <>
                      <DojoOilPicker
                        oils={oilsForSelect}
                        value={slot.oilId}
                        onChange={(oilId) => {
                          const oil = oilsForSelect.find((o) => o.id === oilId);
                          if (oil)
                            setSlotOilsCache((prev) =>
                              new Map(prev).set(oil.id, oil)
                            );
                          updateOil(index, oilId);
                        }}
                        usedOilIds={usedOilIds}
                        disabled={isLoading}
                        placeholder={
                          isLoading
                            ? "Loading..."
                            : "Search or choose fragrance..."
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Slider
                          value={[slot.proportionPct]}
                          onValueChange={([v]) =>
                            updateProportion(
                              index,
                              Math.round(Math.max(0, Math.min(100, v)))
                            )
                          }
                          max={100}
                          min={0}
                          step={1}
                          className="flex-1"
                        />
                        <div className="flex min-w-[4rem] shrink-0 items-center gap-0.5">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={slot.proportionPct}
                            onChange={(e) =>
                              updateProportion(
                                index,
                                Math.max(
                                  0,
                                  Math.min(100, Math.round(Number(e.target.value) || 0))
                                )
                              )
                            }
                            className="w-14 min-w-12 shrink-0 text-center font-mono text-xs"
                            aria-label={`Slot ${index + 1} proportion percent`}
                          />
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            %
                          </span>
                        </div>
                      </div>
                      {oil && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              borderColor: `${FAMILY_COLORS[oil.family]}40`,
                              color: FAMILY_COLORS[oil.family],
                            }}
                          >
                            {oil.family}
                          </Badge>
                          {oil.maxUsageCandle > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              max candle {oil.maxUsageCandle}%
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
            <div
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                isValid
                  ? "bg-primary/5 border-primary/20"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              <span className="text-xs font-semibold">Total</span>
              <span
                className={`font-mono text-xs ${
                  isValid ? "text-primary" : "text-destructive"
                }`}
              >
                {totalPct}%
              </span>
            </div>
          </div>

          {/* Col 3: Blend Preview - one card at a time, scrollable, blur fade-in */}
          <div className="min-h-[800px] flex flex-col lg:col-span-1">
            <Label className="mb-2 text-sm font-medium">Blend Preview</Label>
            {slots.some((s) => s.oilId) ? (
              <BlendPreviewOneAtATime
                oils={slots
                  .map((s) =>
                    s.oilId
                      ? fragranceOilsWithSlots.find((o) => o.id === s.oilId)
                      : null
                  )
                  .filter((oil): oil is FragranceOil => !!oil)}
              />
            ) : selectedForReview ? (
              <div className="min-h-[760px] flex flex-1">
                <AnimatedListItemBlur>
                  <BlendFragranceCard
                    oil={selectedForReview}
                    onAddToBlend={() => addOilFromBrowser(selectedForReview)}
                  />
                </AnimatedListItemBlur>
              </div>
            ) : (
              <div className="flex min-h-[760px] flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
                <p className="px-4 text-center text-sm text-muted-foreground">
                  Click an oil to preview details before adding.
                </p>
              </div>
            )}
          </div>

          {/* Col 4: Fragrance Wheel */}
          <div className="min-h-[400px] space-y-4 overflow-y-auto lg:col-span-1">
            <Label className="text-sm font-medium">Wheel Guidance</Label>
            <div className="rounded-lg border bg-muted/30 p-4 [&_.fill-foreground]:fill-foreground [&_.fill-muted-foreground]:fill-muted-foreground">
              <FragranceWheel
                highlightedFamilies={
                  highlightedFamilies.length > 0 ? highlightedFamilies : undefined
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Product type
                </Label>
                <Select
                  value={productType}
                  onValueChange={(v) => setProductType(v as ProductType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Batch weight (oz)
                </Label>
                <Input
                  type="number"
                  value={batchWeightOz}
                  onChange={(e) =>
                    setBatchWeightOz(Math.max(0.5, Number(e.target.value) || 0.5))
                  }
                  step={0.5}
                  min={0.5}
                  className="mt-1 font-mono"
                />
              </div>
            </div>

            {/* Your blend - name, AI summary, save */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              <Label className="text-sm font-medium">Your blend</Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Blend name
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      placeholder="e.g. Summer Citrus Dream"
                      value={blendName}
                      onChange={(e) => {
                        setBlendName(e.target.value);
                        setSaveError(null);
                      }}
                      className="flex-1"
                    />
                    {aiSuggestedName && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBlendName(aiSuggestedName);
                          setSaveError(null);
                        }}
                        title={`Use suggested: ${aiSuggestedName}`}
                      >
                        Use
                      </Button>
                    )}
                  </div>
                  {aiSuggestedName && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Suggested: &ldquo;{aiSuggestedName}&rdquo;
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDescribe}
                  disabled={
                    aiLoading || fragrancesForApi.length === 0 || !isValid
                  }
                  className="w-full"
                >
                  <Droplets className="mr-2 size-4" />
                  {aiLoading ? (
                    <Shimmer duration={1.5}>Describing...</Shimmer>
                  ) : (
                    "Generate AI Summary"
                  )}
                </Button>
                {aiSummary && (
                  <Reasoning defaultOpen={true}>
                    <ReasoningTrigger label="AI fragrance description" />
                    <ReasoningContent>
                      <ReasoningText text={aiSummary} />
                    </ReasoningContent>
                  </Reasoning>
                )}
                <Button
                  onClick={handleSave}
                  disabled={!canSave || saveLoading}
                  className="w-full"
                >
                  {saveLoading
                    ? "Saving..."
                    : saveSuccess
                      ? "Saved!"
                      : "Save Blend"}
                </Button>
                {saveError && (
                  <p className="text-sm text-destructive">{saveError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
