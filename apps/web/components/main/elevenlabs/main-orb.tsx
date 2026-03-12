"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Orb } from "@/components/ui/orb"

const MAIN_ORB_COLORS: [string, string] = ["#9ca3af", "#6b7280"]

export type MainOrbProps = ComponentProps<typeof Orb> & { mainOrbColors?: [string, string] }

export function MainOrb({ className, colors, mainOrbColors, ...props }: MainOrbProps) {
  const resolvedColors = mainOrbColors ?? colors ?? MAIN_ORB_COLORS
  return <Orb className={cn("rounded-full", className)} colors={resolvedColors} {...props} />
}
