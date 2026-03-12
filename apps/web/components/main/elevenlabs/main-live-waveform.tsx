"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { LiveWaveform } from "@/components/ui/live-waveform"

export type MainLiveWaveformProps = ComponentProps<typeof LiveWaveform> & {
  mainClassName?: string
}

export function MainLiveWaveform({
  className,
  mainClassName,
  ...props
}: MainLiveWaveformProps) {
  return (
    <LiveWaveform
      className={cn("rounded-lg", mainClassName, className)}
      {...props}
    />
  )
}
