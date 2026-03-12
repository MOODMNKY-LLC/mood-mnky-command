"use client"

import { FlaskConical } from "lucide-react"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FORMULA_CATEGORY_LABELS } from "@/lib/types"
import type { Formula } from "@/lib/types"

export interface FeaturedFormulaCardProps {
  formula: Formula
  onSelect: (formula: Formula) => void
  className?: string
}

export function FeaturedFormulaCard({
  formula,
  onSelect,
  className,
}: FeaturedFormulaCardProps) {
  const categoryLabel = formula.categoryId
    ? FORMULA_CATEGORY_LABELS[formula.categoryId]
    : null

  return (
    <MainGlassCard
      className={cn(
        "main-float main-glass-panel-card flex flex-col overflow-hidden border border-border",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <FlaskConical className="h-7 w-7 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Featured formula
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            {formula.name}
          </h2>
          {categoryLabel && (
            <span className="mt-1 inline-block text-sm text-muted-foreground">
              {categoryLabel}
            </span>
          )}
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {formula.description}
          </p>
          <Button
            variant="default"
            size="sm"
            className="mt-4"
            onClick={() => onSelect(formula)}
          >
            Open calculator
          </Button>
        </div>
      </div>
    </MainGlassCard>
  )
}
