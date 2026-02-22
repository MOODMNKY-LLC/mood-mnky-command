"use client"

import Image from "next/image"
import {
  Agent,
  AgentContent,
  AgentHeader,
  AgentInstructions,
} from "@/components/ai-elements/agent"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { FragranceOil, FragranceFamily } from "@/lib/types"
import { FAMILY_COLORS } from "@/lib/types"
import { Sparkles } from "lucide-react"

export interface MnkyFragranceCardFullProps {
  oil: FragranceOil
  className?: string
}

function formatPrice(value: number): string {
  if (value == null || value <= 0) return "—"
  return `$${Number(value).toFixed(2)}`
}

export function MnkyFragranceCardFull({
  oil,
  className,
}: MnkyFragranceCardFullProps) {
  const imageSrc = oil.thumbnailUrl ?? oil.imageUrl ?? null
  const description = oil.description?.trim() || "No description."
  const categoryColor =
    FAMILY_COLORS[oil.family as FragranceFamily] ?? "hsl(var(--muted-foreground))"

  const safetyLabels: { key: keyof FragranceOil; label: string }[] = [
    { key: "candleSafe", label: "Candle" },
    { key: "soapSafe", label: "Soap" },
    { key: "lotionSafe", label: "Lotion" },
    { key: "perfumeSafe", label: "Perfume" },
    { key: "roomSpraySafe", label: "Room spray" },
    { key: "waxMeltSafe", label: "Wax melt" },
  ]

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card text-card-foreground",
        className
      )}
    >
      <Agent className="flex h-full flex-col border-0 bg-transparent p-0 shadow-none">
        <AgentHeader
          name={oil.name}
          icon={
            imageSrc ? (
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={imageSrc}
                  alt={oil.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={
                    imageSrc.startsWith("http") && imageSrc.includes("supabase")
                  }
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
              </div>
            )
          }
        />
        <AgentContent className="flex flex-1 flex-col gap-4 pt-4">
          <AgentInstructions label="Description">
            {description}
          </AgentInstructions>

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Category
            </h4>
            <Badge
              className="border-0 text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {oil.family}
            </Badge>
          </div>

          {(oil.topNotes?.length > 0 ||
            oil.middleNotes?.length > 0 ||
            oil.baseNotes?.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Notes
              </h4>
              <dl className="grid gap-1 text-xs">
                {oil.topNotes?.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">Top</dt>
                    <dd className="flex flex-wrap gap-1">
                      {oil.topNotes.map((n) => (
                        <Badge
                          key={n}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: categoryColor,
                            color: categoryColor,
                          }}
                        >
                          {n}
                        </Badge>
                      ))}
                    </dd>
                  </>
                )}
                {oil.middleNotes?.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">Middle</dt>
                    <dd className="flex flex-wrap gap-1">
                      {oil.middleNotes.map((n) => (
                        <Badge
                          key={n}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: categoryColor,
                            color: categoryColor,
                          }}
                        >
                          {n}
                        </Badge>
                      ))}
                    </dd>
                  </>
                )}
                {oil.baseNotes?.length > 0 && (
                  <>
                    <dt className="text-muted-foreground">Base</dt>
                    <dd className="flex flex-wrap gap-1">
                      {oil.baseNotes.map((n) => (
                        <Badge
                          key={n}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: categoryColor,
                            color: categoryColor,
                          }}
                        >
                          {n}
                        </Badge>
                      ))}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              Safe for
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {safetyLabels.map(({ key, label }) => {
                const safe = oil[key] as boolean
                return (
                  <Badge
                    key={key}
                    variant={safe ? "default" : "secondary"}
                    className={!safe ? "opacity-60" : ""}
                  >
                    {label}
                  </Badge>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            {oil.maxUsageCandle > 0 && (
              <div>
                <span className="text-muted-foreground">Candle max %</span>
                <p className="font-medium">{oil.maxUsageCandle}%</p>
              </div>
            )}
            {oil.maxUsageSoap > 0 && (
              <div>
                <span className="text-muted-foreground">Soap max %</span>
                <p className="font-medium">{oil.maxUsageSoap}%</p>
              </div>
            )}
            {oil.maxUsageLotion > 0 && (
              <div>
                <span className="text-muted-foreground">Lotion max %</span>
                <p className="font-medium">{oil.maxUsageLotion}%</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            {oil.price1oz > 0 && (
              <div>
                <span className="text-muted-foreground">1 oz</span>
                <p className="font-medium">{formatPrice(oil.price1oz)}</p>
              </div>
            )}
            {oil.price4oz > 0 && (
              <div>
                <span className="text-muted-foreground">4 oz</span>
                <p className="font-medium">{formatPrice(oil.price4oz)}</p>
              </div>
            )}
            {oil.price16oz > 0 && (
              <div>
                <span className="text-muted-foreground">16 oz</span>
                <p className="font-medium">{formatPrice(oil.price16oz)}</p>
              </div>
            )}
          </div>

          {(oil.rating > 0 || oil.reviewCount > 0) && (
            <div className="text-xs">
              <span className="text-muted-foreground">Rating</span>
              <p className="font-medium">
                {oil.rating > 0 ? `${oil.rating} / 5` : "—"}
                {oil.reviewCount > 0 && ` (${oil.reviewCount} reviews)`}
              </p>
            </div>
          )}

          {oil.blendsWellWith?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">
                Blends well with
              </h4>
              <div className="flex flex-wrap gap-1">
                {oil.blendsWellWith.map((name) => (
                  <Badge key={name} variant="outline" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {oil.suggestedColors?.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-sm font-medium text-muted-foreground">
                Suggested colors
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {oil.suggestedColors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {oil.allergenStatement && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">
                Allergen
              </h4>
              <p className="whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">
                {oil.allergenStatement}
              </p>
            </div>
          )}
        </AgentContent>
      </Agent>
    </div>
  )
}
