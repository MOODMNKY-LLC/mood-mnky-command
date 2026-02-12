"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MagicCard } from "@/components/ui/magic-card"
import { FlaskConical, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type SavedBlendInput = {
  name?: string
  productType?: string
  fragrances?: Array<{ oilId?: string; oilName?: string; proportionPct?: number }>
  notes?: string
}

export type SavedBlendOutput = {
  success?: boolean
  blendId?: string
  error?: string
}

interface SavedBlendCardProps {
  input: SavedBlendInput
  output: SavedBlendOutput
  className?: string
}

export function SavedBlendCard({ input, output, className }: SavedBlendCardProps) {
  if (!output?.success || output?.error) return null

  const { name, productType, fragrances, notes } = input
  const blendName = name || "My Custom Blend"

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
              <h4 className="font-semibold text-sm truncate">{blendName}</h4>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3.5 text-green-600 shrink-0" />
                <span>Saved successfully</span>
              </div>
            </div>
            {productType && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {productType}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {fragrances && fragrances.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Fragrance blend
              </p>
              <div className="flex flex-wrap gap-1.5">
                {fragrances.map((f, i) => (
                  <Badge
                    key={f.oilId ?? i}
                    variant="outline"
                    className="text-xs font-normal"
                  >
                    {f.oilName ?? "Unknown"} {f.proportionPct != null && `(${f.proportionPct}%)`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {notes && (
            <p className="text-xs text-muted-foreground line-clamp-2">{notes}</p>
          )}
        </CardContent>
      </Card>
    </MagicCard>
  )
}
