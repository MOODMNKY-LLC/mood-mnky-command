"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FAMILY_COLORS } from "@/lib/types"
import type { FragranceOil, FragranceFamily } from "@/lib/types"

export interface FeaturedFragranceCardProps {
  oil: FragranceOil
  className?: string
}

export function FeaturedFragranceCard({ oil, className }: FeaturedFragranceCardProps) {
  const imageSrc = oil.thumbnailUrl ?? oil.imageUrl ?? null
  const description = oil.description?.trim() || "No description."
  const categoryColor =
    FAMILY_COLORS[oil.family as FragranceFamily] ??
    "hsl(var(--muted-foreground))"

  return (
    <MainGlassCard
      className={cn(
        "main-float main-glass-panel-card flex flex-col overflow-hidden border border-border",
        className
      )}
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted/30 sm:h-28 sm:w-28">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={oil.name}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={
                imageSrc.startsWith("http") && imageSrc.includes("supabase")
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Sparkles className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Featured fragrance
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            {oil.name}
          </h2>
          <Badge
            className="mt-2 border-0 text-xs text-white"
            style={{ backgroundColor: categoryColor }}
          >
            {oil.family}
          </Badge>
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
          <Button asChild variant="default" size="sm" className="mt-4">
            <Link href="/dojo">Try in Blending Lab</Link>
          </Button>
        </div>
      </div>
    </MainGlassCard>
  )
}
