"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { BarVisualizer } from "@/components/ui/bar-visualizer"

export type MainBarVisualizerProps = ComponentProps<typeof BarVisualizer> & { mainClassName?: string }

export function MainBarVisualizer({ className, mainClassName, ...props }: MainBarVisualizerProps) {
  return (
    <BarVisualizer className={cn("main-glass-panel rounded-lg p-4", mainClassName, className)} {...props} />
  )
}
