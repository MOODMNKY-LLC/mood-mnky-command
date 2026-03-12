"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { ShimmeringText } from "@/components/ui/shimmering-text"

export type MainShimmeringTextProps = ComponentProps<typeof ShimmeringText> & { mainShimmeringTextClassName?: string }

export function MainShimmeringText(props: MainShimmeringTextProps) {
  const { className, mainShimmeringTextClassName, color, shimmerColor, ...rest } = props
  return (
    <ShimmeringText
      className={cn("text-foreground", mainShimmeringTextClassName, className)}
      color={color ?? "currentColor"}
      shimmerColor={shimmerColor ?? "rgba(255,255,255,0.6)"}
      {...rest}
    />
  )
}
