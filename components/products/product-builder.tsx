"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import {
  Check,
  ChevronRight,
  Droplets,
  FlaskConical,
  Package,
  Star,
  Loader2,
  ExternalLink,
  Flame,
  WifiOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { FRAGRANCE_OILS, FORMULAS, CONTAINERS, WICK_OPTIONS } from "@/lib/data"
import { PRODUCT_TYPE_LABELS, FAMILY_COLORS } from "@/lib/types"
import type { Formula, FragranceOil, ContainerOption, FragranceFamily } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function mapNotionOilToLocal(item: Record<string, unknown>): FragranceOil {
  return {
    id: (item.notionId as string) || String(Math.random()),
    name: (item.name as string) || "Untitled",
    description: (item.description as string) || "",
    family: ((item.family as string) || "Floral") as FragranceFamily,
    subfamilies: ((item.subfamilies as string[]) || []) as FragranceFamily[],
    topNotes: (item.topNotes as string[]) || [],
    middleNotes: (item.middleNotes as string[]) || [],
    baseNotes: (item.baseNotes as string[]) || [],
    type: ((item.type as string) || "Fragrance Oil") as "Fragrance Oil" | "Blending Element",
    candleSafe: (item.candleSafe as boolean) ?? true,
    soapSafe: (item.soapSafe as boolean) ?? false,
    lotionSafe: (item.lotionSafe as boolean) ?? false,
    perfumeSafe: (item.perfumeSafe as boolean) ?? false,
    roomSpraySafe: (item.roomSpraySafe as boolean) ?? false,
    waxMeltSafe: (item.waxMeltSafe as boolean) ?? false,
    maxUsageCandle: (item.maxUsageCandle as number) ?? 0,
    maxUsageSoap: (item.maxUsageSoap as number) ?? 0,
    maxUsageLotion: (item.maxUsageLotion as number) ?? 0,
    price1oz: (item.price1oz as number) ?? 0,
    price4oz: (item.price4oz as number) ?? 0,
    price16oz: (item.price16oz as number) ?? 0,
    rating: (item.rating as number) ?? 0,
    reviewCount: (item.reviewCount as number) ?? 0,
    blendsWellWith: (item.blendsWellWith as string[]) || [],
    alternativeBranding: (item.alternativeBranding as string[]) || [],
    suggestedColors: (item.suggestedColors as string[]) || [],
  }
}

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
  const [selectedContainer, setSelectedContainer] =
    useState<ContainerOption | null>(null)
  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [pushStatus, setPushStatus] = useState<
    "idle" | "pushing" | "success" | "error"
  >("idle")
  const [pushResult, setPushResult] = useState<{
    id?: number
    handle?: string
    error?: string
  } | null>(null)

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

  // Auto-suggest product name when reaching step 4
  function handleNext() {
    const next = Math.min(4, step + 1)
    if (next === 4 && !productName && selectedFragrance && selectedContainer) {
      setProductName(
        `${selectedFragrance.name} ${selectedContainer.capacity} ${selectedContainer.material === "tin" ? "Tin" : selectedContainer.material === "ceramic" ? "Ceramic" : "Jar"}`
      )
      if (!productDescription && selectedFragrance) {
        setProductDescription(selectedFragrance.description)
      }
    }
    setStep(next)
  }

  async function handlePushToShopify() {
    if (!selectedFragrance || !selectedFormula || !selectedContainer) return
    setPushStatus("pushing")
    setPushResult(null)

    const noteParts = [
      ...selectedFragrance.topNotes.map((n) => `Top: ${n}`),
      ...selectedFragrance.middleNotes.map((n) => `Heart: ${n}`),
      ...selectedFragrance.baseNotes.map((n) => `Base: ${n}`),
    ]

    const bodyHtml = `<p>${productDescription || selectedFragrance.description}</p>
<h3>Fragrance Notes</h3>
<p>${noteParts.join(" | ")}</p>
<h3>Product Details</h3>
<ul>
<li>Family: ${selectedFragrance.family}</li>
<li>Container: ${selectedContainer.name}</li>
<li>Wax: ${selectedFormula.waxType || "Soy Blend"}</li>
<li>Wick: ${selectedFormula.wickType === "wood" ? "Wood Wick" : "Cotton Wick"}</li>
</ul>
<p><em>Handcrafted by MOOD MNKY</em></p>`

    const tags = [
      selectedFragrance.family.toLowerCase(),
      selectedFormula.productType,
      selectedContainer.material,
      selectedFormula.wickType === "wood" ? "wood-wick" : "cotton-wick",
      ...selectedFragrance.topNotes.slice(0, 2).map((n) => n.toLowerCase()),
      "mood-mnky",
    ].join(", ")

    try {
      const res = await fetch("/api/shopify/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: productName,
          body_html: bodyHtml,
          vendor: "MOOD MNKY",
          product_type:
            PRODUCT_TYPE_LABELS[selectedFormula.productType],
          status: "draft",
          tags,
          price: selectedContainer.suggestedRetail.toFixed(2),
          sku: `MM-${selectedFragrance.id}-${selectedContainer.id}`.toUpperCase(),
          weight: selectedFormula.totalWeight,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setPushStatus("error")
        setPushResult({ error: data.error || "Failed to push to Shopify" })
        return
      }

      setPushStatus("success")
      setPushResult({
        id: data.product?.id,
        handle: data.product?.handle,
      })
    } catch (err) {
      setPushStatus("error")
      setPushResult({
        error: err instanceof Error ? err.message : "Network error",
      })
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
          formula={selectedFormula}
        />
      )}
      {step === 4 && (
        <StepReview
          fragrance={selectedFragrance}
          formula={selectedFormula}
          container={selectedContainer}
          productName={productName}
          setProductName={setProductName}
          productDescription={productDescription}
          setProductDescription={setProductDescription}
        />
      )}

      {/* Push status */}
      {pushStatus === "success" && pushResult && (
        <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
          <Check className="h-5 w-5 text-success" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">
              Product pushed to Shopify as draft
            </span>
            <span className="text-xs text-muted-foreground">
              Product ID: {pushResult.id}
            </span>
          </div>
          {pushResult.handle && (
            <a
              href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "mood-mnky-3.myshopify.com"}/admin/products/${pushResult.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View in Shopify <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}
      {pushStatus === "error" && pushResult?.error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <span className="text-sm text-destructive">{pushResult.error}</span>
        </div>
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
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Continue
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handlePushToShopify}
            disabled={!canProceed() || pushStatus === "pushing"}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pushStatus === "pushing" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pushing...
              </>
            ) : pushStatus === "success" ? (
              <>
                <Check className="mr-1 h-4 w-4" />
                Pushed to Shopify
              </>
            ) : (
              "Push to Shopify"
            )}
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
  const { data: notionData, isLoading } = useSWR(
    "/api/notion/sync/fragrance-oils",
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1, dedupingInterval: 60000 }
  )

  const isLive = notionData?.fragranceOils && !notionData?.error
  const oils: FragranceOil[] = useMemo(() => {
    if (!isLive) return FRAGRANCE_OILS
    return (notionData.fragranceOils as Record<string, unknown>[]).map(mapNotionOilToLocal)
  }, [isLive, notionData])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Select a Fragrance Oil
        </h2>
        {isLoading ? (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Loading
          </Badge>
        ) : isLive ? (
          <Badge className="text-[10px] border-0 bg-success/10 text-success">
            {oils.length} from Notion
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] gap-1 text-muted-foreground">
            <WifiOff className="h-3 w-3" />
            Sample data
          </Badge>
        )}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-16 mb-3" />
              <div className="flex gap-1">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {oils.map((oil) => (
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
                    <Badge
                      variant="outline"
                      className="w-fit text-[10px]"
                      style={{
                        borderColor: `${FAMILY_COLORS[oil.family]}40`,
                        color: FAMILY_COLORS[oil.family],
                      }}
                    >
                      {oil.family}
                    </Badge>
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
                      className="text-[10px] border-chart-1/30 text-chart-1"
                    >
                      {n}
                    </Badge>
                  ))}
                  {oil.baseNotes.slice(0, 1).map((n) => (
                    <Badge
                      key={n}
                      variant="outline"
                      className="text-[10px] border-chart-3/30 text-chart-3"
                    >
                      {n}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
          if (f.productType === "candle" && !fragrance.candleSafe) return false
          if (f.productType === "soap" && !fragrance.soapSafe) return false
          if (f.productType === "lotion" && !fragrance.lotionSafe) return false
          if (f.productType === "room-spray" && !fragrance.roomSpraySafe)
            return false
          if (f.productType === "wax-melt" && !fragrance.waxMeltSafe)
            return false
          if (f.productType === "perfume" && !fragrance.perfumeSafe)
            return false
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
                  {formula.wickType && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        formula.wickType === "wood"
                          ? "border-accent/40 text-accent"
                          : "border-primary/40 text-primary"
                      }`}
                    >
                      <Flame className="mr-1 h-2.5 w-2.5" />
                      {formula.wickType === "wood" ? "Wood" : "Cotton"}
                    </Badge>
                  )}
                  {formula.waxType && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-muted-foreground"
                    >
                      {formula.waxType}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ---- Step 3: Select Container (CandleScience) ----
function StepContainer({
  selected,
  onSelect,
  formula,
}: {
  selected: ContainerOption | null
  onSelect: (c: ContainerOption) => void
  formula: Formula | null
}) {
  // Filter containers by whether the formula is candle-based
  const isCandle =
    formula?.productType === "candle" || formula?.productType === "wax-melt"

  const containers = isCandle ? CONTAINERS : CONTAINERS.slice(0, 4) // show subset for non-candle

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-foreground">
        Select Container
      </h2>
      <p className="text-sm text-muted-foreground">
        CandleScience containers with wick compatibility. Prices shown are
        wholesale cost; suggested retail is listed separately.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {containers.map((container) => {
          const compatWicks = WICK_OPTIONS.filter((w) =>
            container.compatibleWicks.includes(w.id)
          )
          return (
            <Card
              key={container.id}
              className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
                selected?.id === container.id
                  ? "border-primary ring-1 ring-primary/30"
                  : ""
              }`}
              onClick={() => onSelect(container)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {container.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] text-muted-foreground"
                      >
                        {container.capacity}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize text-muted-foreground"
                      >
                        {container.material}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground">
                      Cost
                    </span>
                    <span className="text-sm font-mono text-foreground">
                      ${container.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground">
                      Suggested Retail
                    </span>
                    <span className="text-sm font-mono font-semibold text-primary">
                      ${container.suggestedRetail.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground">
                    Diameter: {container.diameter}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {compatWicks.map((w) => (
                      <Badge
                        key={w.id}
                        className={`text-[9px] border-0 ${
                          w.type === "wood"
                            ? "bg-accent/10 text-accent"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {w.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ---- Step 4: Review ----
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
  container: ContainerOption | null
  productName: string
  setProductName: (v: string) => void
  productDescription: string
  setProductDescription: (v: string) => void
}) {
  const margin = container
    ? container.suggestedRetail - container.price
    : 0

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Product Details
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="product-name"
              className="text-xs text-muted-foreground"
            >
              Product Name
            </Label>
            <Input
              id="product-name"
              placeholder="e.g., Forest Chai 8 oz Tin"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="product-desc"
              className="text-xs text-muted-foreground"
            >
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
            sublabel={fragrance?.family}
          />
          <Separator className="bg-border" />
          <SummaryRow
            label="Formula"
            value={formula?.name || "Not selected"}
            sublabel={
              formula
                ? `${PRODUCT_TYPE_LABELS[formula.productType]} | ${formula.wickType === "wood" ? "Wood Wick" : "Cotton Wick"}`
                : undefined
            }
          />
          <Separator className="bg-border" />
          <SummaryRow
            label="Container"
            value={container?.name || "Not selected"}
            sublabel={
              container
                ? `${container.capacity} ${container.material} | Cost: $${container.price.toFixed(2)}`
                : undefined
            }
          />
          <Separator className="bg-border" />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/50 p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Retail Price
              </span>
              <span className="text-lg font-mono font-semibold text-primary">
                ${container?.suggestedRetail.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-border bg-secondary/50 p-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Margin
              </span>
              <span className="text-lg font-mono font-semibold text-success">
                ${margin.toFixed(2)}
              </span>
            </div>
          </div>

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

          <div className="flex flex-col gap-1 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Shopify Status
            </span>
            <span className="text-xs text-foreground">
              Will be pushed as <strong>Draft</strong> to mood-mnky-3.myshopify.com
            </span>
          </div>
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
