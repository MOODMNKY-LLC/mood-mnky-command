"use client"

import Image from "next/image"
import {
  Agent,
  AgentContent,
  AgentHeader,
} from "@/components/ai-elements/agent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MainGlassCard } from "./main-glass-card"
import { MnkyFragranceCardFull } from "./mnky-fragrance-card-full"
import { cn } from "@/lib/utils"
import type { FragranceOil, FragranceFamily } from "@/lib/types"
import { FAMILY_COLORS } from "@/lib/types"
import { Sparkles, Expand } from "lucide-react"

export interface MnkyFragranceCardProps {
  oil: FragranceOil
  /** When set, card is clickable and opens dialog. Omit to render only the compact card. */
  withDialog?: boolean
  className?: string
}

export function MnkyFragranceCard({
  oil,
  withDialog = true,
  className,
}: MnkyFragranceCardProps) {
  const imageSrc = oil.thumbnailUrl ?? oil.imageUrl ?? null
  const description = oil.description?.trim() || "No description."
  const categoryColor =
    FAMILY_COLORS[oil.family as FragranceFamily] ??
    "hsl(var(--muted-foreground))"

  const card = (
    <MainGlassCard
      className={cn(
        "group flex w-[200px] flex-shrink-0 flex-col transition-all duration-200 hover:shadow-lg",
        "aspect-[3/5] overflow-hidden",
        className
      )}
    >
      <Agent className="flex h-full flex-col border-0 bg-transparent p-0 shadow-none">
        <AgentHeader
          name={oil.name}
          className="min-h-0 flex-shrink-0 border-b px-3 py-2"
          icon={
            imageSrc ? (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
                <Image
                  src={imageSrc}
                  alt={oil.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                  unoptimized={
                    imageSrc.startsWith("http") && imageSrc.includes("supabase")
                  }
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          }
        />
        <AgentContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 pt-2">
          <div className="flex flex-shrink-0 flex-wrap gap-1">
            <Badge
              className="border-0 text-xs text-white"
              style={{ backgroundColor: categoryColor }}
            >
              {oil.family}
            </Badge>
          </div>
          <div
            className="min-h-0 flex-1 overflow-hidden overflow-y-auto overscroll-contain transition-[overflow] duration-200 group-hover:overflow-y-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {withDialog && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-auto flex-shrink-0 gap-1 text-xs"
              asChild
            >
              <DialogTrigger className="w-full justify-center">
                <Expand className="h-3.5 w-3.5" />
                View full
              </DialogTrigger>
            </Button>
          )}
        </AgentContent>
      </Agent>
    </MainGlassCard>
  )

  if (withDialog) {
    return (
      <Dialog>
        {card}
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle className="sr-only">{oil.name}</DialogTitle>
          <MnkyFragranceCardFull oil={oil} />
        </DialogContent>
      </Dialog>
    )
  }

  return card
}
