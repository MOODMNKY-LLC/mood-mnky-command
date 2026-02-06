"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Search, Loader2, WifiOff, FlaskConical, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { FORMULAS } from "@/lib/data"
import type { Formula, ProductType } from "@/lib/types"
import { PRODUCT_TYPE_LABELS } from "@/lib/types"
import { FormulaCard } from "@/components/formulas/formula-card"
import { FormulaCalculator } from "@/components/formulas/formula-calculator"

const productTypes: Array<{ value: "all" | ProductType; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "candle", label: "Candle" },
  { value: "soap", label: "Soap" },
  { value: "lotion", label: "Lotion" },
  { value: "room-spray", label: "Room Spray" },
  { value: "wax-melt", label: "Wax Melt" },
  { value: "perfume", label: "Perfume" },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface NotionFormula {
  notionId: string
  name: string
  description: string
  productType: string
  baseType: string
  status: string
  tags: string[]
  fragranceLoad: number
  totalWeight: number
  source: string
  wickType: string
  waxType: string
  notes: string
  lastEdited: string
  notionUrl: string
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  )
}

function NotionFormulaDetail({ formula }: { formula: NotionFormula }) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl text-foreground">
              {formula.name}
            </CardTitle>
            {formula.notionUrl && (
              <a
                href={formula.notionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          {formula.description && (
            <p className="text-sm text-muted-foreground">{formula.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {formula.productType && (
              <Badge className="bg-primary/10 text-primary border-0">
                {formula.productType}
              </Badge>
            )}
            {formula.status && (
              <Badge
                variant="outline"
                className={`text-xs ${formula.status === "Active" ? "border-success/40 text-success" : "text-muted-foreground"}`}
              >
                {formula.status}
              </Badge>
            )}
            {formula.wickType && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {formula.wickType}
              </Badge>
            )}
            {formula.waxType && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {formula.waxType}
              </Badge>
            )}
            {formula.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs text-muted-foreground">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground">Base Type</span>
            <span className="text-sm font-medium text-foreground">{formula.baseType || "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground">Fragrance Load</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {formula.fragranceLoad ? `${formula.fragranceLoad}%` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground">Total Weight</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {formula.totalWeight ? `${formula.totalWeight}g` : "N/A"}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-border bg-secondary/50 p-3">
            <span className="text-xs text-muted-foreground">Source</span>
            <span className="text-sm font-medium text-foreground">{formula.source || "N/A"}</span>
          </div>
        </div>
        {formula.notes && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4">
            <span className="text-xs font-medium text-muted-foreground">Notes</span>
            <p className="mt-1 text-sm text-foreground leading-relaxed">{formula.notes}</p>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Last edited: {new Date(formula.lastEdited).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric"
          })}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FormulasPage() {
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
  const [selectedNotionFormula, setSelectedNotionFormula] = useState<NotionFormula | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | ProductType>("all")

  const { data: notionData, isLoading: notionLoading } = useSWR(
    "/api/notion/sync/formulas",
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1, dedupingInterval: 60000 }
  )

  const isLiveData = notionData?.formulas && !notionData?.error
  const notionFormulas: NotionFormula[] = isLiveData ? notionData.formulas : []

  // Filter local formulas
  const filteredLocalFormulas = useMemo(() => {
    if (isLiveData) return [] // If we have live data, don't show local
    return FORMULAS.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchesType = typeFilter === "all" || f.productType === typeFilter
      return matchesSearch && matchesType
    })
  }, [search, typeFilter, isLiveData])

  // Filter Notion formulas
  const filteredNotionFormulas = useMemo(() => {
    if (!isLiveData) return []
    return notionFormulas.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchesType =
        typeFilter === "all" ||
        f.productType.toLowerCase().replace(/\s+/g, "-") === typeFilter
      return matchesSearch && matchesType
    })
  }, [search, typeFilter, isLiveData, notionFormulas])

  const handleSelectNotionFormula = (formula: NotionFormula) => {
    setSelectedNotionFormula(formula)
    setSelectedFormula(null)
  }

  const handleSelectLocalFormula = (formula: Formula) => {
    setSelectedFormula(formula)
    setSelectedNotionFormula(null)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Formula Catalog
          </h1>
          {notionLoading ? (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing
            </Badge>
          ) : isLiveData ? (
            <Badge className="text-[10px] border-0 bg-success/10 text-success">
              {notionData.total} formulas from Notion
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] gap-1 text-muted-foreground">
              <WifiOff className="h-3 w-3" />
              Sample data
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse, create, and calculate formulations for all product types
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search formulas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border text-foreground"
          />
        </div>
        <Tabs
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as "all" | ProductType)}
        >
          <TabsList className="bg-secondary">
            {productTypes.map((pt) => (
              <TabsTrigger
                key={pt.value}
                value={pt.value}
                className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {pt.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-1">
          {notionLoading && !isLiveData ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : isLiveData ? (
            filteredNotionFormulas.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8">
                <p className="text-sm text-muted-foreground">No formulas found</p>
              </div>
            ) : (
              filteredNotionFormulas.map((formula) => (
                <Card
                  key={formula.notionId}
                  className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
                    selectedNotionFormula?.notionId === formula.notionId
                      ? "border-primary ring-1 ring-primary/30"
                      : ""
                  }`}
                  onClick={() => handleSelectNotionFormula(formula)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <FlaskConical className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-sm font-semibold text-foreground">{formula.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {formula.description || `${formula.baseType} - ${formula.waxType || "N/A"}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {formula.productType && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          {formula.productType}
                        </Badge>
                      )}
                      {formula.status && (
                        <Badge variant="outline" className={`text-xs ${formula.status === "Active" ? "border-success/40 text-success" : "text-muted-foreground"}`}>
                          {formula.status}
                        </Badge>
                      )}
                      {formula.fragranceLoad > 0 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground font-mono">
                          {formula.fragranceLoad}% FO
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            filteredLocalFormulas.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8">
                <p className="text-sm text-muted-foreground">No formulas found</p>
              </div>
            ) : (
              filteredLocalFormulas.map((formula) => (
                <FormulaCard
                  key={formula.id}
                  formula={formula}
                  onSelect={handleSelectLocalFormula}
                  isSelected={selectedFormula?.id === formula.id}
                />
              ))
            )
          )}
        </div>
        <div className="lg:col-span-2">
          {selectedNotionFormula ? (
            <NotionFormulaDetail formula={selectedNotionFormula} />
          ) : selectedFormula ? (
            <FormulaCalculator formula={selectedFormula} />
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50">
              <p className="text-sm text-muted-foreground">
                Select a formula to open the calculator
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
