"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Search, Loader2, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Formula, FormulaCategory } from "@/lib/types"
import { FORMULA_CATEGORY_LABELS } from "@/lib/types"
import { FormulaCard } from "@/components/formulas/formula-card"
import { FormulaCalculator } from "@/components/formulas/formula-calculator"

const categoryFilters: Array<{ value: "all" | FormulaCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "skincare", label: "Skincare" },
  { value: "haircare", label: "Haircare" },
  { value: "diy", label: "DIY" },
  { value: "candle", label: "Candle" },
]

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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

export default function FormulasPage() {
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | FormulaCategory>("all")

  const apiUrl =
    categoryFilter === "all"
      ? "/api/formulas"
      : `/api/formulas?category=${categoryFilter}`

  const { data, isLoading, error } = useSWR<{ formulas: Formula[] }>(
    apiUrl,
    fetcher,
    { revalidateOnFocus: false, errorRetryCount: 1, dedupingInterval: 60000 }
  )

  const formulas = data?.formulas ?? []

  const filteredFormulas = useMemo(() => {
    return formulas.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      return matchesSearch
    })
  }, [formulas, search])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Formula Catalog
          </h1>
          {isLoading ? (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading
            </Badge>
          ) : (
            <Badge className="text-[10px] border-0 bg-primary/10 text-primary">
              {formulas.length} formulas
              {formulas.length > 0 && (
                <span className="ml-1 text-muted-foreground">from Whole Elise</span>
              )}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Browse and calculate formulations for bath, body, and cosmetic products
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
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as "all" | FormulaCategory)}
        >
          <TabsList className="bg-secondary">
            {categoryFilters.map((cf) => (
              <TabsTrigger
                key={cf.value}
                value={cf.value}
                className="text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                {cf.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          ) : filteredFormulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8">
              <p className="text-sm text-muted-foreground">
                {formulas.length === 0 && !error
                  ? "No formulas in database yet."
                  : "No formulas match your filters."}
              </p>
            </div>
          ) : (
            filteredFormulas.map((formula) => (
              <FormulaCard
                key={formula.id}
                formula={formula}
                onSelect={setSelectedFormula}
                isSelected={selectedFormula?.id === formula.id}
              />
            ))
          )}
        </div>
        <div className="lg:col-span-2">
          {selectedFormula ? (
            <div className="flex flex-col gap-2">
              {selectedFormula.externalUrl && (
                <a
                  href={selectedFormula.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View tutorial on Whole Elise
                </a>
              )}
              <FormulaCalculator formula={selectedFormula} />
            </div>
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
