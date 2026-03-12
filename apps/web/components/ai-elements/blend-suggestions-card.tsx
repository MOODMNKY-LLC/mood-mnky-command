"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MagicCard } from "@/components/ui/magic-card"
import { Button } from "@/components/ui/button"
import { FlaskConical, ChevronRight, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

export type BlendSuggestionsInput = {
  oils?: Array<{ oilId?: string; oilName?: string }>
  proportions?: Array<{ oilId?: string; oilName?: string; proportionPct?: number }>
  explanation?: string
}

interface BlendSuggestionsCardProps {
  input: BlendSuggestionsInput
  output?: { oils?: unknown[]; proportions?: unknown[]; explanation?: string }
  className?: string
  onRefine?: () => void
  onProceed?: () => void
}

export function BlendSuggestionsCard({
  input,
  output,
  className,
  onRefine,
  onProceed,
}: BlendSuggestionsCardProps) {
  const proportions = (output?.proportions ?? input?.proportions ?? []) as Array<{
    oilId?: string
    oilName?: string
    proportionPct?: number
  }>
  const oils = (output?.oils ?? input?.oils ?? proportions) as Array<{
    oilId?: string
    oilName?: string
  }>
  const explanation = (output?.explanation ?? input?.explanation) ?? ""

  if (oils.length === 0 && proportions.length === 0) return null

  return (
    <MagicCard
      className={cn(
        "rounded-lg border overflow-hidden",
        "gradientFrom-amber-500/20 gradientTo-rose-500/20",
        className
      )}
      gradientFrom="rgba(245, 158, 11, 0.3)"
      gradientTo="rgba(244, 63, 94, 0.3)"
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <FlaskConical className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Blend Suggestion</h4>
              <p className="text-xs text-muted-foreground">
                Review the oils and proportions below
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {proportions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Proportions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {proportions.map((p, i) => (
                  <Badge
                    key={p.oilId ?? i}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {p.oilName ?? "Unknown"}{" "}
                    {p.proportionPct != null && `(${p.proportionPct}%)`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {explanation && (
            <p className="text-xs text-muted-foreground">{explanation}</p>
          )}
          {(onRefine || onProceed) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {onRefine && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={onRefine}
                >
                  <Pencil className="size-3" />
                  Refine
                </Button>
              )}
              {onProceed && (
                <Button
                  variant="default"
                  size="sm"
                  className="text-xs gap-1"
                  onClick={onProceed}
                >
                  Proceed
                  <ChevronRight className="size-3" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  )
}
