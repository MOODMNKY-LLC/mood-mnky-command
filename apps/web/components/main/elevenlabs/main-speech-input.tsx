"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { SpeechInput } from "@/components/ui/speech-input"

export type MainSpeechInputProps = ComponentProps<typeof SpeechInput> & { mainClassName?: string }

export function MainSpeechInput({ className, mainClassName, ...props }: MainSpeechInputProps) {
  return (
    <SpeechInput className={cn("main-glass-panel rounded-xl", mainClassName, className)} {...props} />
  )
}
