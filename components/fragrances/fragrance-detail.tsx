"use client"

import { useState } from "react"
import Link from "next/link"
import { Star, CheckCircle, XCircle, DollarSign, Pencil, ExternalLink, ImageIcon, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { FragranceOil } from "@/lib/types"
import {
  FAMILY_COLORS,
  FAMILY_KINDRED,
  FAMILY_COMPLEMENTARY,
  FAMILY_SEASONS,
} from "@/lib/types"
import { FragranceEditDialog } from "@/components/fragrances/fragrance-edit-dialog"

interface FragranceDetailProps {
  oil: FragranceOil
  onEditSuccess?: () => void
}

export function FragranceDetail({ oil, onEditSuccess }: FragranceDetailProps) {
  const [editOpen, setEditOpen] = useState(false)
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

  const kindred = FAMILY_KINDRED[oil.family]
  const complementary = FAMILY_COMPLEMENTARY[oil.family]
  const season = FAMILY_SEASONS[oil.family]

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
                <Badge
                  className="border-0"
                  style={{
                    backgroundColor: `${FAMILY_COLORS[oil.family]}20`,
                    color: FAMILY_COLORS[oil.family],
                  }}
                >
                  {oil.family}
                </Badge>
                {oil.subfamilies.map((sub) => (
                  <Badge
                    key={sub}
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: `${FAMILY_COLORS[sub]}40`,
                      color: FAMILY_COLORS[sub],
                    }}
                  >
                    {sub}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-muted-foreground">
                  {oil.type}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {oil.rating}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({oil.reviewCount})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              {oil.notionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5"
                  asChild
                >
                  <a href={oil.notionUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Notion
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Image display */}
          {oil.imageUrl ? (
            <div className="mb-4 flex items-start gap-3">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border">
                <img
                  src={oil.imageUrl}
                  alt={`${oil.name} fragrance scene`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="h-8 w-fit gap-1.5" asChild>
                  <Link href={`/studio?fragranceId=${oil.id}&fragranceName=${encodeURIComponent(oil.name)}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate Scene
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-4 flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5" asChild>
                <Link href={`/studio?fragranceId=${oil.id}&fragranceName=${encodeURIComponent(oil.name)}`}>
                  <ImageIcon className="h-3.5 w-3.5" />
                  Generate Scene
                </Link>
              </Button>
            </div>
          )}
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

      {/* Family Blending Guide */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-sm text-foreground">
            Fragrance Wheel Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                Season
              </span>
              <Badge variant="outline" className="text-xs text-foreground">
                {season}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                Kindred
              </span>
              <div className="flex gap-1.5">
                {kindred.map((fam) => (
                  <Badge
                    key={fam}
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: `${FAMILY_COLORS[fam]}40`,
                      color: FAMILY_COLORS[fam],
                    }}
                  >
                    {fam}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-xs font-medium text-muted-foreground">
                Complementary
              </span>
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: `${FAMILY_COLORS[complementary]}40`,
                  color: FAMILY_COLORS[complementary],
                }}
              >
                {complementary}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kindred families are adjacent on the fragrance wheel and blend harmoniously.
              Complementary families are across the wheel and create complex, intriguing blends.
            </p>
          </div>
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
                <Badge key={color} variant="secondary" className="text-sm">
                  {color}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FragranceEditDialog
        oil={oil}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => onEditSuccess?.()}
      />
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
