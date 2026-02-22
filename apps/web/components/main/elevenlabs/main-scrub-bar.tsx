"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { ScrubBarContainer } from "@/components/ui/scrub-bar"

export type MainScrubBarProps = ComponentProps<typeof ScrubBarContainer> & { mainClassName?: string }

export function MainScrubBar({ className, mainClassName, ...props }: MainScrubBarProps) {
  return <ScrubBarContainer className={cn("w-full", mainClassName, className)} {...props} />
}
