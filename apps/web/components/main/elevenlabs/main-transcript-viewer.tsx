"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { TranscriptViewerContainer } from "@/components/ui/transcript-viewer"

export type MainTranscriptViewerProps = ComponentProps<typeof TranscriptViewerContainer> & {
  mainClassName?: string
}

export function MainTranscriptViewer({
  className,
  mainClassName,
  ...props
}: MainTranscriptViewerProps) {
  return (
    <TranscriptViewerContainer
      className={cn("main-glass-panel rounded-xl p-4", mainClassName, className)}
      {...props}
    />
  )
}
