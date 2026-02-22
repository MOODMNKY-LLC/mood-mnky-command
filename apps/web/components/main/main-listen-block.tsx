"use client"

import { AudioPlayerProvider, MainAudioPlayer } from "@/components/main/elevenlabs"
import {
  AudioPlayerButton,
  AudioPlayerProgress,
  AudioPlayerTime,
  AudioPlayerDuration,
} from "@/components/ui/audio-player"
import { MainGlassCard } from "@/components/main/main-glass-card"

export interface MainListenBlockProps {
  audioSampleUrl: string | null
  showAudioSample: boolean
}

const MAIN_SAMPLE_ITEM = {
  id: "main-landing-sample",
  src: "",
  data: { name: "Brand sample" },
}

export function MainListenBlock({ audioSampleUrl, showAudioSample }: MainListenBlockProps) {
  if (!showAudioSample || !audioSampleUrl?.trim()) return null

  const item = { ...MAIN_SAMPLE_ITEM, src: audioSampleUrl }

  return (
    <AudioPlayerProvider>
      <MainGlassCard className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-foreground">Listen to a sample</h3>
        <MainAudioPlayer>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <AudioPlayerButton item={item} />
              <AudioPlayerTime className="text-sm text-muted-foreground" />
              <span className="text-muted-foreground">/</span>
              <AudioPlayerDuration className="text-sm text-muted-foreground" />
            </div>
            <AudioPlayerProgress className="w-full" />
          </div>
        </MainAudioPlayer>
      </MainGlassCard>
    </AudioPlayerProvider>
  )
}
