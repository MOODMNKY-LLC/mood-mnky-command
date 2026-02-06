"use client"

import { useState, useMemo } from "react"
import { Plus, X, FlaskConical, Droplets } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FRAGRANCE_OILS } from "@/lib/data"
import type { FragranceOil, ProductType, FragranceFamily } from "@/lib/types"
import { PRODUCT_TYPE_LABELS, FAMILY_COLORS } from "@/lib/types"

interface BlendSlot {
  oilId: string | null
  percentage: number
}

const PRODUCT_MAX_LOAD: Record<string, number> = {
  candle: 12,
  soap: 6,
  lotion: 5,
  "room-spray": 10,
  perfume: 30,
  "wax-melt": 15,
}

export function BlendingCalculator() {
  const [productType, setProductType] = useState<ProductType>("candle")
  const [fragranceLoad, setFragranceLoad] = useState(10)
  const [batchWeight, setBatchWeight] = useState(400)
  const [slots, setSlots] = useState<BlendSlot[]>([
    { oilId: null, percentage: 100 },
  ])

  const maxLoad = PRODUCT_MAX_LOAD[productType] ?? 10

  // Constrain fragrance load when switching product types
  const effectiveLoad = Math.min(fragranceLoad, maxLoad)

  const totalPercentage = slots.reduce((sum, s) => sum + s.percentage, 0)
  const isValid = totalPercentage === 100

  const fragranceWeight = (effectiveLoad / 100) * batchWeight
  const baseWeight = batchWeight - fragranceWeight

  const usedOilIds = slots.map((s) => s.oilId).filter(Boolean) as string[]

  function addSlot() {
    if (slots.length >= 4) return
    // redistribute percentages evenly
    const count = slots.length + 1
    const evenPercent = Math.floor(100 / count)
    const newSlots = slots.map((s) => ({ ...s, percentage: evenPercent }))
    newSlots.push({ oilId: null, percentage: 100 - evenPercent * slots.length })
    setSlots(newSlots)
  }

  function removeSlot(index: number) {
    if (slots.length <= 1) return
    const newSlots = slots.filter((_, i) => i !== index)
    // redistribute
    const count = newSlots.length
    const evenPercent = Math.floor(100 / count)
    const adjusted = newSlots.map((s, i) => ({
      ...s,
      percentage: i === count - 1 ? 100 - evenPercent * (count - 1) : evenPercent,
    }))
    setSlots(adjusted)
  }

  function updateOil(index: number, oilId: string) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, oilId } : s))
    )
  }

  function updatePercentage(index: number, value: number) {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, percentage: value } : s))
    )
  }

  const blendFamilies = useMemo(() => {
    const families: FragranceFamily[] = []
    for (const slot of slots) {
      if (slot.oilId) {
        const oil = FRAGRANCE_OILS.find((o) => o.id === slot.oilId)
        if (oil && !families.includes(oil.family)) {
          families.push(oil.family)
        }
      }
    }
    return families
  }, [slots])

  return (
    <div className="flex flex-col gap-6">
      {/* Settings */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Blend Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Product Type */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Product Type
              </Label>
              <Select
                value={productType}
                onValueChange={(v) => {
                  setProductType(v as ProductType)
                  const newMax = PRODUCT_MAX_LOAD[v] ?? 10
                  if (fragranceLoad > newMax) setFragranceLoad(newMax)
                }}
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
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

            {/* Batch Weight */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Batch Weight (g)
              </Label>
              <Input
                type="number"
                value={batchWeight}
                onChange={(e) =>
                  setBatchWeight(Math.max(10, Number(e.target.value) || 10))
                }
                className="bg-secondary border-border text-foreground font-mono"
              />
            </div>

            {/* Fragrance Load */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Fragrance Load:{" "}
                <span className="font-mono text-primary">{effectiveLoad}%</span>
                <span className="text-muted-foreground ml-1">(max {maxLoad}%)</span>
              </Label>
              <Slider
                value={[effectiveLoad]}
                onValueChange={([v]) => setFragranceLoad(v)}
                max={maxLoad}
                min={1}
                step={0.5}
                className="py-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blend Slots */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Droplets className="h-4 w-4 text-primary" />
            Fragrance Blend
            {blendFamilies.length > 0 && (
              <span className="flex gap-1 ml-2">
                {blendFamilies.map((f) => (
                  <span
                    key={f}
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: FAMILY_COLORS[f] }}
                    title={f}
                  />
                ))}
              </span>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            disabled={slots.length >= 4}
            className="h-8 text-xs border-border text-foreground"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Fragrance
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {slots.map((slot, index) => {
            const oil = slot.oilId
              ? FRAGRANCE_OILS.find((o) => o.id === slot.oilId)
              : null
            const slotWeight = (slot.percentage / 100) * fragranceWeight

            return (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Fragrance {index + 1}
                  </span>
                  {slots.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeSlot(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* Oil Select */}
                  <div className="sm:col-span-2">
                    <Select
                      value={slot.oilId ?? ""}
                      onValueChange={(v) => updateOil(index, v)}
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Choose a fragrance..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FRAGRANCE_OILS.filter(
                          (o) =>
                            !usedOilIds.includes(o.id) || o.id === slot.oilId
                        ).map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            <span className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{
                                  backgroundColor: FAMILY_COLORS[o.family],
                                }}
                              />
                              {o.name}
                              <span className="text-muted-foreground text-xs">
                                ({o.family})
                              </span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Percentage */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={slot.percentage}
                      onChange={(e) =>
                        updatePercentage(
                          index,
                          Math.max(0, Math.min(100, Number(e.target.value) || 0))
                        )
                      }
                      className="bg-secondary border-border text-foreground font-mono text-center"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>

                {/* Oil info row */}
                {oil && (
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
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
                      {oil.subfamilies.slice(0, 2).map((sub) => (
                        <Badge
                          key={sub}
                          variant="outline"
                          className="text-[10px]"
                          style={{
                            borderColor: `${FAMILY_COLORS[sub]}30`,
                            color: FAMILY_COLORS[sub],
                          }}
                        >
                          {sub}
                        </Badge>
                      ))}
                    </div>
                    <span className="text-sm font-mono font-medium text-primary">
                      {slotWeight.toFixed(2)} g
                    </span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Total percentage */}
          <div
            className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
              isValid
                ? "bg-primary/5 border-primary/20"
                : "bg-destructive/5 border-destructive/20"
            }`}
          >
            <span className="text-sm font-semibold text-foreground">
              Blend Total
            </span>
            <div className="flex items-center gap-4">
              <span
                className={`text-sm font-mono ${isValid ? "text-primary" : "text-destructive"}`}
              >
                {totalPercentage}%
              </span>
              <span className="text-sm font-mono font-semibold text-foreground">
                {fragranceWeight.toFixed(2)} g fragrance
              </span>
            </div>
          </div>
          {!isValid && (
            <p className="text-xs text-destructive">
              Blend percentages must add up to 100%. Currently at{" "}
              {totalPercentage}%.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Batch Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Batch Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryItem
              label="Batch Weight"
              value={`${batchWeight.toFixed(0)} g`}
            />
            <SummaryItem
              label="Base Material"
              value={`${baseWeight.toFixed(2)} g`}
            />
            <SummaryItem
              label="Total Fragrance"
              value={`${fragranceWeight.toFixed(2)} g`}
              highlight
            />
            <SummaryItem
              label="Fragrance Load"
              value={`${effectiveLoad}%`}
              highlight
            />
          </div>

          {/* Per-oil breakdown */}
          {slots.some((s) => s.oilId) && (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Per-Fragrance Breakdown
              </span>
              {slots
                .filter((s) => s.oilId)
                .map((slot) => {
                  const oil = FRAGRANCE_OILS.find(
                    (o) => o.id === slot.oilId
                  )!
                  const weight = (slot.percentage / 100) * fragranceWeight
                  return (
                    <div
                      key={slot.oilId}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: FAMILY_COLORS[oil.family],
                          }}
                        />
                        <span className="text-sm text-foreground">
                          {oil.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({slot.percentage}%)
                        </span>
                      </div>
                      <span className="text-sm font-mono font-medium text-primary">
                        {weight.toFixed(2)} g
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/50 p-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-lg font-semibold font-mono ${
          highlight ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  )
}
