"use client"

import { FlaskConical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Formula } from "@/lib/types"
import { PRODUCT_TYPE_LABELS, FORMULA_CATEGORY_LABELS } from "@/lib/types"

interface FormulaCardProps {
  formula: Formula
  onSelect: (formula: Formula) => void
  isSelected: boolean
}

export function FormulaCard({ formula, onSelect, isSelected }: FormulaCardProps) {
  const totalIngredients = formula.phases.reduce(
    (sum, phase) => sum + phase.ingredients.length,
    0
  )

  return (
    <Card
      className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
        isSelected ? "border-primary ring-1 ring-primary/30" : ""
      }`}
      onClick={() => onSelect(formula)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FlaskConical className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-foreground">
                {formula.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {formula.description}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
            {formula.categoryId
              ? FORMULA_CATEGORY_LABELS[formula.categoryId]
              : PRODUCT_TYPE_LABELS[formula.productType]}
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {formula.phases.length} phases
          </Badge>
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {totalIngredients} ingredients
          </Badge>
          {formula.source === "whole-elise" && (
            <Badge variant="outline" className="text-xs text-muted-foreground border-chart-2/30 text-chart-2">
              Whole Elise
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
