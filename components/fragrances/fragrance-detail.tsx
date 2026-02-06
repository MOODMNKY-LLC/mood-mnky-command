"use client"

import { Star, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { FragranceOil } from "@/lib/types"

interface FragranceDetailProps {
  oil: FragranceOil
}

export function FragranceDetail({ oil }: FragranceDetailProps) {
  const safetyItems = [
    { label: "Candle", safe: oil.candleSafe, max: oil.maxUsageCandle },
    { label: "Soap", safe: oil.soapSafe, max: oil.maxUsageSoap },
    { label: "Lotion", safe: oil.lotionSafe, max: oil.maxUsageLotion },
    { label: "Perfume", safe: oil.perfumeSafe, max: 0 },
    { label: "Room Spray", safe: oil.roomSpraySafe, max: 0 },
    { label: "Wax Melt", safe: oil.waxMeltSafe, max: 0 },
  ]

  const pricing = [
    { size: "1 oz", price: oil.price1oz },
    { size: "4 oz", price: oil.price4oz },
    { size: "16 oz", price: oil.price16oz },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl text-foreground">
                {oil.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-0">
                  {oil.category}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  {oil.type}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {oil.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                ({oil.reviewCount})
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {oil.description}
          </p>
          {oil.alternativeBranding.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Also known as:
              </span>
              {oil.alternativeBranding.map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="text-xs text-foreground"
                >
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Pyramid */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Fragrance Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <NoteRow
              label="Top"
              notes={oil.topNotes}
              colorClass="border-chart-1/40 text-chart-1 bg-chart-1/5"
            />
            <NoteRow
              label="Middle"
              notes={oil.middleNotes}
              colorClass="border-chart-2/40 text-chart-2 bg-chart-2/5"
            />
            <NoteRow
              label="Base"
              notes={oil.baseNotes}
              colorClass="border-chart-3/40 text-chart-3 bg-chart-3/5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Safety & Usage */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Safety & Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {safetyItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-lg border border-border p-3"
              >
                {item.safe ? (
                  <CheckCircle className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                  {item.safe && item.max > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      Max {item.max}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {pricing.map((p) => (
              <div
                key={p.size}
                className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-border bg-secondary/50 p-3"
              >
                <span className="text-xs text-muted-foreground">{p.size}</span>
                <span className="text-lg font-semibold font-mono text-foreground">
                  ${p.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blends Well With */}
      {oil.blendsWellWith.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-foreground">
              Blends Well With
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {oil.blendsWellWith.map((blend) => (
                <Badge
                  key={blend}
                  variant="outline"
                  className="text-sm text-foreground"
                >
                  {blend}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Colors */}
      {oil.suggestedColors.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-foreground">
              Suggested Colors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {oil.suggestedColors.map((color) => (
                <Badge
                  key={color}
                  variant="secondary"
                  className="text-sm"
                >
                  {color}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function NoteRow({
  label,
  notes,
  colorClass,
}: {
  label: string
  notes: string[]
  colorClass: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-14 shrink-0 text-xs font-medium text-muted-foreground pt-1">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <Badge
            key={note}
            variant="outline"
            className={`text-xs ${colorClass}`}
          >
            {note}
          </Badge>
        ))}
      </div>
    </div>
  )
}
