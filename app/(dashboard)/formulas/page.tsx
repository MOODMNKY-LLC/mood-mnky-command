"use client"

import { useState, useMemo } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function FormulasPage() {
  const [selectedFormula, setSelectedFormula] = useState<Formula | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | ProductType>("all")

  const filteredFormulas = useMemo(() => {
    return FORMULAS.filter((f) => {
      const matchesSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase()) ||
        f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
      const matchesType = typeFilter === "all" || f.productType === typeFilter
      return matchesSearch && matchesType
    })
  }, [search, typeFilter])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Formula Catalog
        </h1>
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
          {filteredFormulas.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8">
              <p className="text-sm text-muted-foreground">
                No formulas found
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
