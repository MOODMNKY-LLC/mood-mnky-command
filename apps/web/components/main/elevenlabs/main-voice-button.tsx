"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { VoiceButton } from "@/components/ui/voice-button"

export type MainVoiceButtonProps = ComponentProps<typeof VoiceButton> & {
  mainClassName?: string
}

export function MainVoiceButton({
  className,
  mainClassName,
  ...props
}: MainVoiceButtonProps) {
  return (
    <VoiceButton
      className={cn("main-glass-panel rounded-xl", mainClassName, className)}
      {...props}
    />
  )
}
