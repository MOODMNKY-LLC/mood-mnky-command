"use client"

import { useState, useMemo, useEffect } from "react"
import useSWR from "swr"
import { Search, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { MainNav, MainFooter, FeaturedFormulaCard } from "@/components/main"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"
import { FormulaCard } from "@/components/formulas/formula-card"
import { FormulaCalculator } from "@/components/formulas/formula-calculator"
import type { Formula, FormulaCategory } from "@/lib/types"

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
    <div className="main-glass-panel-card rounded-xl border border-border p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex flex-1 flex-col gap-2">
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

export default function MainCollectionsFormulasPage() {
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | FormulaCategory>("all")
  const [featuredFormula, setFeaturedFormula] = useState<Formula | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/main/featured-formula")
      .then((r) => r.json())
      .then((data: { featuredFormula?: Formula | null }) => {
        if (!cancelled && data.featuredFormula) setFeaturedFormula(data.featuredFormula)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
        (f.tags && f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
      return matchesSearch
    })
  }, [formulas, search])

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border sm:h-28 sm:w-28">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.formulas}
              alt="MOOD MNKY – Formulas"
              fill
              className="object-cover object-center"
              hideOnError
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Formulas
            </h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Browse and calculate formulations for bath, body, and cosmetic
              products. Select a formula to open the calculator.
            </p>
          </div>
        </div>

        {featuredFormula && (
          <section className="mb-10">
            <FeaturedFormulaCard
              formula={featuredFormula}
              onSelect={setSelectedFormula}
            />
          </section>
        )}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search formulas…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="main-glass-panel pl-9"
              />
            </div>
            <Tabs
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as "all" | FormulaCategory)}
            >
              <TabsList className="main-glass-panel bg-transparent">
                {categoryFilters.map((cf) => (
                  <TabsTrigger
                    key={cf.value}
                    value={cf.value}
                    className="data-[state=active]:bg-background/80 data-[state=active]:text-foreground"
                  >
                    {cf.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto lg:col-span-1">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
              ) : filteredFormulas.length === 0 ? (
                <div className="main-glass-panel-card flex flex-col items-center justify-center rounded-xl border border-border p-8">
                  <p className="text-sm text-muted-foreground">
                    {formulas.length === 0 && !error
                      ? "No formulas in catalog yet."
                      : "No formulas match your filters."}
                  </p>
                </div>
              ) : (
                filteredFormulas.map((formula) => (
                  <div
                    key={formula.id}
                    className="main-float rounded-xl [&_.border-border]:border-border/80"
                  >
                    <FormulaCard
                      formula={formula}
                      onSelect={setSelectedFormula}
                      isSelected={selectedFormula?.id === formula.id}
                    />
                  </div>
                ))
              )}
            </div>
            <div className="lg:col-span-2">
              {selectedFormula ? (
                <div className="main-glass-panel-card flex flex-col gap-4 rounded-xl border border-border p-6">
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
                <div className="main-glass-panel-soft flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8">
                  <p className="text-sm text-muted-foreground">
                    Select a formula to open the calculator
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
