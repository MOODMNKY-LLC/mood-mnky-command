"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Plus, X, FlaskConical, Droplets } from "lucide-react";
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
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import { DojoOilPicker } from "@/components/dojo/dojo-oil-picker";
import { DojoFragranceBrowser } from "@/components/dojo/dojo-fragrance-browser";
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
  PRODUCT_TYPE_LABELS,
  FAMILY_COLORS,
} from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BlendSlot {
  oilId: string | null;
  proportionPct: number;
}

export function DojoBlendingLab() {
  const [productType, setProductType] = useState<ProductType>("candle");
  const [batchWeightG, setBatchWeightG] = useState(400);
  const [blendName, setBlendName] = useState("");
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slots, setSlots] = useState<BlendSlot[]>([{ oilId: null, proportionPct: 100 }]);
  const [browserSearch, setBrowserSearch] = useState("");

  const { data, isLoading } = useSWR<{ fragranceOils: FragranceOil[] }>(
    "/api/fragrance-oils",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  const fragranceOils = data?.fragranceOils ?? [];

  // Include both Fragrance Oil and Blending Element types
  const oilsForSelect = fragranceOils;

  const totalPct = slots.reduce((s, slot) => s + slot.proportionPct, 0);
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

  function addSlot() {
    if (slots.length >= 4) return;
    const count = slots.length + 1;
    const evenPercent = Math.floor(100 / count);
    const newSlots = slots.map((s) => ({ ...s, proportionPct: evenPercent }));
    newSlots.push({ oilId: null, proportionPct: 100 - evenPercent * slots.length });
    setSlots(newSlots);
  }

  function removeSlot(index: number) {
    if (slots.length <= 1) return;
    const newSlots = slots.filter((_, i) => i !== index);
    const count = newSlots.length;
    const evenPercent = Math.floor(100 / count);
    const adjusted = newSlots.map((s, i) => ({
      ...s,
      proportionPct: i === count - 1 ? 100 - evenPercent * (count - 1) : evenPercent,
    }));
    setSlots(adjusted);
  }

  function updateOil(index: number, oilId: string) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, oilId } : s))
    );
  }

  function addOilFromBrowser(oil: FragranceOil) {
    const firstEmpty = slots.findIndex((s) => !s.oilId);
    if (firstEmpty >= 0) {
      updateOil(firstEmpty, oil.id);
    } else if (slots.length < 4) {
      const count = slots.length + 1;
      const evenPercent = Math.floor(100 / count);
      const newSlots = slots.map((s) => ({ ...s, proportionPct: evenPercent }));
      newSlots.push({
        oilId: oil.id,
        proportionPct: 100 - evenPercent * slots.length,
      });
      setSlots(newSlots);
    }
  }

  function updateProportion(index: number, value: number) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, proportionPct: value } : s))
    );
  }

  async function handleDescribe() {
    if (fragrancesForApi.length === 0) return;
    setAiLoading(true);
    setAiSummary(null);
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
            batchWeightG,
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
        <div className="grid min-h-[400px] gap-6 lg:grid-cols-4">
          {/* Left: Fragrance Browser - search + browse oils */}
          <div className="min-h-[400px] overflow-y-auto lg:col-span-1">
            <Label className="mb-2 block text-sm font-medium">Browse Oils</Label>
            {fragrancesForApi.length === 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {["Cozy fall blend", "Citrus summer", "Woody + floral", "Vanilla gourmand"].map(
                  (s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBrowserSearch(s)}
                      className="rounded-md border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {s}
                    </button>
                  )
                )}
              </div>
            )}
            <DojoFragranceBrowser
              oils={oilsForSelect}
              onSelectOil={addOilFromBrowser}
              usedOilIds={usedOilIds}
              isLoading={isLoading}
              search={browserSearch}
              onSearchChange={setBrowserSearch}
            />
          </div>
          {/* Center: Oil Selector + Sliders - fixed height, scroll if overflow */}
          <div className="min-h-[400px] space-y-4 overflow-y-auto lg:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Oil Selection</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addSlot}
                disabled={slots.length >= 4}
              >
                <Plus className="mr-1 size-4" />
                Add slot
              </Button>
            </div>
            {slots.map((slot, index) => {
              const oil = slot.oilId
                ? fragranceOils.find((o) => o.id === slot.oilId)
                : null;
              return (
                <div
                  key={index}
                  className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Slot {index + 1}
                    </span>
                    {slots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => removeSlot(index)}
                      >
                        <X className="size-3" />
                      </Button>
                    )}
                  </div>
                  <DojoOilPicker
                    oils={oilsForSelect}
                    value={slot.oilId}
                    onChange={(oilId) => updateOil(index, oilId)}
                    usedOilIds={usedOilIds}
                    disabled={isLoading}
                    placeholder={
                      isLoading
                        ? "Loading..."
                        : "Search or choose fragrance..."
                    }
                  />
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[slot.proportionPct]}
                      onValueChange={([v]) =>
                        updateProportion(index, Math.max(0, Math.min(100, v)))
                      }
                      max={100}
                      min={0}
                      step={1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={slot.proportionPct}
                      onChange={(e) =>
                        updateProportion(
                          index,
                          Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        )
                      }
                      className="w-14 shrink-0 text-center font-mono text-sm"
                    />
                    <span className="w-5 shrink-0 text-xs text-muted-foreground">%</span>
                  </div>
                  {oil && (
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px]"
                        style={{
                          borderColor: `${FAMILY_COLORS[oil.family]}40`,
                          color: FAMILY_COLORS[oil.family],
                        }}
                      >
                        {oil.family}
                      </Badge>
                      {oil.maxUsageCandle > 0 && (
                        <span className="text-xs text-muted-foreground">
                          max candle {oil.maxUsageCandle}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                isValid
                  ? "bg-primary/5 border-primary/20"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              <span className="text-sm font-semibold">Total</span>
              <span
                className={`font-mono text-sm ${
                  isValid ? "text-primary" : "text-destructive"
                }`}
              >
                {totalPct}%
              </span>
            </div>
          </div>

          {/* Right: Fragrance Wheel - fixed height, scroll if overflow */}
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
                  Batch weight (g)
                </Label>
                <Input
                  type="number"
                  value={batchWeightG}
                  onChange={(e) =>
                    setBatchWeightG(Math.max(10, Number(e.target.value) || 10))
                  }
                  className="mt-1 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDescribe}
            disabled={
              aiLoading || fragrancesForApi.length === 0 || !isValid
            }
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
        </div>

        {/* Save Blend */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-muted-foreground">Blend name</Label>
              <Input
                placeholder="e.g. Summer Citrus Dream"
                value={blendName}
                onChange={(e) => {
                  setBlendName(e.target.value);
                  setSaveError(null);
                }}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!canSave || saveLoading}
            >
              {saveLoading ? "Saving..." : saveSuccess ? "Saved!" : "Save Blend"}
            </Button>
          </div>
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
