"use client"

import { useState } from "react"
import {
  Check,
  ChevronRight,
  Droplets,
  FlaskConical,
  Package,
  Star,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { FRAGRANCE_OILS, FORMULAS } from "@/lib/data"
import { PRODUCT_TYPE_LABELS } from "@/lib/types"
import type { Formula, FragranceOil } from "@/lib/types"

const CONTAINER_STYLES = [
  { id: "16oz-tin", name: "16 oz Tin", price: 28.0 },
  { id: "8oz-tumbler", name: "8 oz Tumbler", price: 22.0 },
  { id: "4oz-tin", name: "4 oz Tin", price: 14.0 },
  { id: "wax-melt-pack", name: "Wax Melt Pack (6)", price: 12.0 },
  { id: "room-spray-8oz", name: "8 oz Room Spray", price: 16.0 },
  { id: "bar-soap-5oz", name: "5 oz Bar Soap", price: 10.0 },
  { id: "lotion-8oz", name: "8 oz Body Lotion", price: 18.0 },
]

const STEPS = [
  { id: 1, label: "Fragrance", icon: Droplets },
  { id: 2, label: "Formula", icon: FlaskConical },
  { id: 3, label: "Container", icon: Package },
  { id: 4, label: "Review", icon: Check },
]

export function ProductBuilder() {
  const [step, setStep] = useState(1)
  const [selectedFragrance, setSelectedFragrance] =
    useState<FragranceOil | null>(null)
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
  const [selectedContainer, setSelectedContainer] = useState<string | null>(
    null
  )
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")

  const selectedContainerData = CONTAINER_STYLES.find(
    (c) => c.id === selectedContainer
  )

  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedFragrance !== null
      case 2:
        return selectedFormula !== null
      case 3:
        return selectedContainer !== null
      case 4:
        return productName.trim() !== ""
      default:
        return false
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (s.id < step) setStep(s.id)
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                s.id === step
                  ? "bg-primary text-primary-foreground"
                  : s.id < step
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {step === 1 && (
        <StepFragrance
          selected={selectedFragrance}
          onSelect={setSelectedFragrance}
        />
      )}
      {step === 2 && (
        <StepFormula
          selected={selectedFormula}
          onSelect={setSelectedFormula}
          fragrance={selectedFragrance}
        />
      )}
      {step === 3 && (
        <StepContainer
          selected={selectedContainer}
          onSelect={setSelectedContainer}
        />
      )}
      {step === 4 && (
        <StepReview
          fragrance={selectedFragrance}
          formula={selectedFormula}
          container={selectedContainerData}
          productName={productName}
          setProductName={setProductName}
          productDescription={productDescription}
          setProductDescription={setProductDescription}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="border-border text-foreground"
        >
          Back
        </Button>
        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={!canProceed()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={!canProceed()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Push to Shopify
          </Button>
        )}
      </div>
    </div>
  )
}

// ---- Step 1: Select Fragrance ----
function StepFragrance({
  selected,
  onSelect,
}: {
  selected: FragranceOil | null
  onSelect: (oil: FragranceOil) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Select a Fragrance Oil
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FRAGRANCE_OILS.map((oil) => (
          <Card
            key={oil.id}
            className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
              selected?.id === oil.id
                ? "border-primary ring-1 ring-primary/30"
                : ""
            }`}
            onClick={() => onSelect(oil)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-foreground">
                    {oil.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {oil.category}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  <span className="text-xs text-foreground">{oil.rating}</span>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {oil.topNotes.slice(0, 2).map((n) => (
                  <Badge
                    key={n}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-muted-foreground"
                  >
                    {n}
                  </Badge>
                ))}
                {oil.baseNotes.slice(0, 1).map((n) => (
                  <Badge
                    key={n}
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 text-muted-foreground"
                  >
                    {n}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---- Step 2: Select Formula ----
function StepFormula({
  selected,
  onSelect,
  fragrance,
}: {
  selected: Formula | null
  onSelect: (formula: Formula) => void
  fragrance: FragranceOil | null
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Select a Formula
      </h2>
      {fragrance && (
        <p className="text-sm text-muted-foreground">
          Choose a base formula for{" "}
          <span className="text-primary font-medium">{fragrance.name}</span>.
          Only formulas compatible with this fragrance oil are shown.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FORMULAS.filter((f) => {
          if (!fragrance) return true
          // Filter by safety
          if (f.productType === "candle" && !fragrance.candleSafe) return false
          if (f.productType === "soap" && !fragrance.soapSafe) return false
          if (f.productType === "lotion" && !fragrance.lotionSafe) return false
          if (f.productType === "room-spray" && !fragrance.roomSpraySafe) return false
          if (f.productType === "wax-melt" && !fragrance.waxMeltSafe) return false
          if (f.productType === "perfume" && !fragrance.perfumeSafe) return false
          return true
        }).map((formula) => (
          <Card
            key={formula.id}
            className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
              selected?.id === formula.id
                ? "border-primary ring-1 ring-primary/30"
                : ""
            }`}
            onClick={() => onSelect(formula)}
          >
            <CardContent className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {formula.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {formula.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                    {PRODUCT_TYPE_LABELS[formula.productType]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-muted-foreground"
                  >
                    {formula.phases.length} phases
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---- Step 3: Select Container ----
function StepContainer({
  selected,
  onSelect,
}: {
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Select Container Style
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CONTAINER_STYLES.map((container) => (
          <Card
            key={container.id}
            className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
              selected === container.id
                ? "border-primary ring-1 ring-primary/30"
                : ""
            }`}
            onClick={() => onSelect(container.id)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {container.name}
                </span>
              </div>
              <span className="text-sm font-mono font-semibold text-primary">
                ${container.price.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---- Step 4: Review & Customize ----
function StepReview({
  fragrance,
  formula,
  container,
  productName,
  setProductName,
  productDescription,
  setProductDescription,
}: {
  fragrance: FragranceOil | null
  formula: Formula | null
  container: { id: string; name: string; price: number } | undefined
  productName: string
  setProductName: (v: string) => void
  productDescription: string
  setProductDescription: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Product Details */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-name" className="text-xs text-muted-foreground">
              Product Name
            </Label>
            <Input
              id="product-name"
              placeholder="e.g., Forest Chai 16oz Tin"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="product-desc" className="text-xs text-muted-foreground">
              Product Description
            </Label>
            <Textarea
              id="product-desc"
              placeholder="Enter a product description for Shopify..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="min-h-[120px] bg-secondary border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Product Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SummaryRow
            label="Fragrance"
            value={fragrance?.name || "Not selected"}
            sublabel={fragrance?.category}
          />
          <Separator className="bg-border" />
          <SummaryRow
            label="Formula"
            value={formula?.name || "Not selected"}
            sublabel={
              formula
                ? PRODUCT_TYPE_LABELS[formula.productType]
                : undefined
            }
          />
          <Separator className="bg-border" />
          <SummaryRow
            label="Container"
            value={container?.name || "Not selected"}
            sublabel={
              container ? `$${container.price.toFixed(2)}` : undefined
            }
          />
          <Separator className="bg-border" />
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Retail Price
            </span>
            <span className="text-lg font-mono font-semibold text-primary">
              ${container?.price.toFixed(2) || "0.00"}
            </span>
          </div>

          {/* Notes Preview */}
          {fragrance && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">
                Fragrance Notes
              </span>
              <div className="flex flex-wrap gap-1">
                {fragrance.topNotes.map((n) => (
                  <Badge
                    key={n}
                    variant="outline"
                    className="text-[10px] border-chart-1/30 text-chart-1"
                  >
                    {n}
                  </Badge>
                ))}
                {fragrance.middleNotes.map((n) => (
                  <Badge
                    key={n}
                    variant="outline"
                    className="text-[10px] border-chart-2/30 text-chart-2"
                  >
                    {n}
                  </Badge>
                ))}
                {fragrance.baseNotes.map((n) => (
                  <Badge
                    key={n}
                    variant="outline"
                    className="text-[10px] border-chart-3/30 text-chart-3"
                  >
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  sublabel,
}: {
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {sublabel && (
          <span className="text-xs text-muted-foreground">{sublabel}</span>
        )}
      </div>
    </div>
  )
}
