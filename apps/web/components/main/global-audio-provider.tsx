"use client"

import { GlobalPlaylistProvider } from "@/components/main/global-playlist-context"
import { PersistentPlayerBar } from "@/components/main/persistent-player-bar"

/**
 * Wraps the app with the global playlist and AudioPlayerProvider and renders the
 * persistent MNKY MUSIK player bar. Mount in root layout so any page can set
 * the active track or playlist (e.g. from /main/media or dojo sidebar) and
 * playback persists across navigation.
 */
export function GlobalAudioProvider({ children }: { children: React.ReactNode }) {
  return (
    <GlobalPlaylistProvider>
      {children}
      <PersistentPlayerBar />
    </GlobalPlaylistProvider>
  )
}
