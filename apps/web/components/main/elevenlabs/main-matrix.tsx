"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Matrix } from "@/components/ui/matrix"

const MAIN_PALETTE = { on: "rgba(255,255,255,0.25)", off: "rgba(0,0,0,0.04)" }

export type MainMatrixProps = ComponentProps<typeof Matrix> & { mainClassName?: string }

export function MainMatrix(props: MainMatrixProps) {
  const { className, mainClassName, palette = MAIN_PALETTE, ...rest } = props
  return <Matrix className={cn("pointer-events-none opacity-60", mainClassName, className)} palette={palette} {...rest} />
}
