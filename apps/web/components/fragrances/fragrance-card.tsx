"use client"

import { Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FragranceOil } from "@/lib/types"
import { FAMILY_COLORS } from "@/lib/types"

interface FragranceCardProps {
  oil: FragranceOil
  onSelect: (oil: FragranceOil) => void
  isSelected: boolean
}

export function FragranceCard({ oil, onSelect, isSelected }: FragranceCardProps) {
  return (
    <Card
      className={`cursor-pointer border-border bg-card transition-all hover:border-primary/40 ${
        isSelected ? "border-primary ring-1 ring-primary/30" : ""
      }`}
      onClick={() => onSelect(oil)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">
              {oil.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {oil.description}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">
              {oil.rating}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {oil.topNotes.slice(0, 3).map((note) => (
              <Badge
                key={note}
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-chart-1/30 text-chart-1"
              >
                {note}
              </Badge>
            ))}
            {oil.middleNotes.slice(0, 2).map((note) => (
              <Badge
                key={note}
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-chart-2/30 text-chart-2"
              >
                {note}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              className="text-[10px]"
              style={{
                backgroundColor: `${FAMILY_COLORS[oil.family]}18`,
                color: FAMILY_COLORS[oil.family],
                borderColor: `${FAMILY_COLORS[oil.family]}40`,
              }}
            >
              {oil.family}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground">
              ${oil.price1oz.toFixed(2)}/oz
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
