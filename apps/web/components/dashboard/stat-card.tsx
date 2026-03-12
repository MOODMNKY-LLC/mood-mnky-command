"use client"

import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AnimatedStatValue } from "@/components/dashboard/animated-stat-value"

export type StatCardStatus = "default" | "success" | "warning"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: LucideIcon
  /** Optional status for border/icon tint (e.g. success when synced). */
  status?: StatCardStatus
  /** Optional short explanation shown on hover. */
  tooltip?: string
  /** When true and value is a number, value counts up from 0 on mount. */
  animateValue?: boolean
}

const statusBorderClass: Record<StatCardStatus, string> = {
  default: "border-border",
  success: "border-success/40",
  warning: "border-warning/40",
}

const statusIconClass: Record<StatCardStatus, string> = {
  default: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  status = "default",
  tooltip,
  animateValue = false,
}: StatCardProps) {
  const isNumeric = typeof value === "number"
  const showAnimated = animateValue && isNumeric

  const card = (
    <Card
      className={cn("bg-card border", statusBorderClass[status])}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {title}
            </span>
            <span className="text-3xl font-semibold tracking-tight text-foreground">
              {showAnimated ? (
                <AnimatedStatValue value={value} />
              ) : (
                value
              )}
            </span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              statusIconClass[status]
            )}
          >
            <Icon className="h-6 w-6 shrink-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="block cursor-help">{card}</span>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return card
}
