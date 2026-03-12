"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { MicSelector } from "@/components/ui/mic-selector"

export type MainMicSelectorProps = ComponentProps<typeof MicSelector> & {
  mainClassName?: string
}

export function MainMicSelector({
  className,
  mainClassName,
  ...props
}: MainMicSelectorProps) {
  return (
    <MicSelector
      className={cn("main-glass-panel rounded-lg", mainClassName, className)}
      {...props}
    />
  )
}
