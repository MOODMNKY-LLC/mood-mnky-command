"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Waveform } from "@/components/ui/waveform"

export type MainWaveformProps = ComponentProps<typeof Waveform> & {
  mainClassName?: string
}

export function MainWaveform({
  className,
  mainClassName,
  ...props
}: MainWaveformProps) {
  return (
    <Waveform
      className={cn("rounded-lg", mainClassName, className)}
      {...props}
    />
  )
}
