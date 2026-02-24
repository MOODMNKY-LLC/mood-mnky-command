"use client"

import { AudioPlayerProvider } from "@/components/main/elevenlabs"
import { PersistentPlayerBar } from "@/components/main/persistent-player-bar"

/**
 * Wraps the app with the global AudioPlayerProvider and renders the persistent
 * MNKY MUSIK player bar. Mount in root layout so any page can set the active
 * track (e.g. from /main/media) and the bar persists across navigation.
 */
export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  return (
    <AudioPlayerProvider>
      {children}
      <PersistentPlayerBar />
    </AudioPlayerProvider>
  )
}
