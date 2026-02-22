"use client"

import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export { AudioPlayerProvider, useAudioPlayer } from "@/components/ui/audio-player"
export {
  AudioPlayerProgress,
  AudioPlayerTime,
  AudioPlayerDuration,
  AudioPlayerButton,
  AudioPlayerSpeed,
  AudioPlayerSpeedButtonGroup,
} from "@/components/ui/audio-player"

export type MainAudioPlayerProps = HTMLAttributes<HTMLDivElement> & { mainClassName?: string }

/** Wrapper for Main-section audio player; use with AudioPlayerProvider and audio-player subcomponents. */
export function MainAudioPlayer({ className, mainClassName, children, ...props }: MainAudioPlayerProps) {
  return (
    <div className={cn("main-glass-panel rounded-xl p-4", mainClassName, className)} {...props}>
      {children}
    </div>
  )
}
