"use client"

import { useState, useMemo } from "react"
import { Minus, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Formula, Phase } from "@/lib/types"
import { PRODUCT_TYPE_LABELS } from "@/lib/types"

interface FormulaCalculatorProps {
  formula: Formula
}

export function FormulaCalculator({ formula }: FormulaCalculatorProps) {
  const [batchSize, setBatchSize] = useState(formula.totalWeight)

  const totalPercentage = useMemo(() => {
    return formula.phases.reduce(
      (sum, phase) =>
        sum +
        phase.ingredients.reduce((pSum, ing) => pSum + ing.percentage, 0),
      0
    )
  }, [formula])

  const calculateWeight = (percentage: number) => {
    return ((percentage / 100) * batchSize).toFixed(2)
  }

  const adjustBatchSize = (delta: number) => {
    setBatchSize((prev) => Math.max(10, prev + delta))
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl text-foreground">
            {formula.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{formula.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge className="bg-primary/10 text-primary border-0">
              {PRODUCT_TYPE_LABELS[formula.productType]}
            </Badge>
            {formula.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="batch-size" className="text-xs text-muted-foreground">
            Batch Size (g)
          </Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 bg-transparent"
              onClick={() => adjustBatchSize(-50)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              id="batch-size"
              type="number"
              value={batchSize}
              onChange={(e) =>
                setBatchSize(Math.max(10, Number(e.target.value) || 10))
              }
              className="h-8 w-24 text-center font-mono bg-secondary border-border text-foreground"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 bg-transparent"
              onClick={() => adjustBatchSize(50)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {formula.phases.map((phase, phaseIndex) => (
            <PhaseTable
              key={phase.id}
              phase={phase}
              phaseIndex={phaseIndex}
              calculateWeight={calculateWeight}
            />
          ))}
          <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Total
            </span>
            <div className="flex items-center gap-6">
              <span className="text-sm font-mono text-muted-foreground">
                {totalPercentage.toFixed(1)}%
              </span>
              <span className="text-sm font-mono font-semibold text-primary">
                {batchSize.toFixed(2)} g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PhaseTable({
  phase,
  phaseIndex,
  calculateWeight,
}: {
  phase: Phase
  phaseIndex: number
  calculateWeight: (percentage: number) => string
}) {
  const phasePercentage = phase.ingredients.reduce(
    (sum, ing) => sum + ing.percentage,
    0
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          <span className="text-muted-foreground font-normal mr-2">
            Phase {phaseIndex + 1}
          </span>
          {phase.name}
        </h4>
        <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
          {phasePercentage}%
        </Badge>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">
                Ingredient
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">
                Function
              </TableHead>
              <TableHead className="text-right text-xs text-muted-foreground w-24">
                %
              </TableHead>
              <TableHead className="text-right text-xs text-muted-foreground w-28">
                Weight (g)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phase.ingredients.map((ingredient) => (
              <TableRow
                key={ingredient.id}
                className="border-border hover:bg-secondary/50"
              >
                <TableCell className="text-sm text-foreground">
                  <span className="flex items-center gap-2">
                    {ingredient.name}
                    {ingredient.isFragranceOil && (
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0">
                        FO
                      </Badge>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ingredient.function}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-foreground">
                  {ingredient.percentage}%
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-medium text-primary">
                  {calculateWeight(ingredient.percentage)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
