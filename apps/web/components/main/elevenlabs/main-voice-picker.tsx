"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { VoicePicker } from "@/components/ui/voice-picker"

export type MainVoicePickerProps = ComponentProps<typeof VoicePicker> & {
  mainClassName?: string
}

export function MainVoicePicker({
  className,
  mainClassName,
  ...props
}: MainVoicePickerProps) {
  return (
    <VoicePicker
      className={cn("main-glass-panel rounded-lg", mainClassName, className)}
      {...props}
    />
  )
}
