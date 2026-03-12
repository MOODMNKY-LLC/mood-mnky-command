"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { AudioPlayerProvider, useAudioPlayer } from "@/components/ui/audio-player"

/** Shared track shape for global playlist (compatible with MainMediaAudioTrack / VerseTrack). */
export type GlobalPlaylistTrack = {
  id: string
  public_url: string | null
  audio_title?: string | null
  audio_artist?: string | null
  audio_album?: string | null
  cover_art_url?: string | null
  file_name?: string | null
  duration_seconds?: number | null
  sort_order?: number
}

export type RepeatMode = "off" | "repeatOne" | "repeatAll"

function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i)
  const result: number[] = []
  while (indices.length > 0) {
    const i = Math.floor(Math.random() * indices.length)
    result.push(indices.splice(i, 1)[0]!)
  }
  return result
}

interface GlobalPlaylistApi {
  tracks: GlobalPlaylistTrack[]
  currentIndex: number
  repeatMode: RepeatMode
  shuffle: boolean
  setPlaylist: (tracks: GlobalPlaylistTrack[], startIndex?: number) => void
  next: () => void
  prev: () => void
  setRepeatMode: (mode: RepeatMode) => void
  setShuffle: (on: boolean) => void
  /** Effective track index (accounts for shuffle order). */
  effectiveIndex: number
  /** Current track at effective index. */
  currentTrack: GlobalPlaylistTrack | null
  /** Used by sync effect: true when we should play after setting activeItem. */
  consumeShouldPlayAfterSync: () => boolean
}

const GlobalPlaylistContext = createContext<GlobalPlaylistApi | null>(null)

export function useGlobalPlaylist(): GlobalPlaylistApi {
  const api = useContext(GlobalPlaylistContext)
  if (!api) {
    throw new Error(
      "useGlobalPlaylist must be used within GlobalPlaylistProvider"
    )
  }
  return api
}

function trackToItem(track: GlobalPlaylistTrack) {
  return {
    id: track.id,
    src: track.public_url ?? "",
    data: { track },
  }
}

/** Syncs playlist state to the underlying AudioPlayerProvider. */
function PlaylistSync() {
  const player = useAudioPlayer<{ track?: GlobalPlaylistTrack }>()
  const playlist = useGlobalPlaylist()

  useEffect(() => {
    const { tracks, currentTrack } = playlist
    if (tracks.length === 0 || !currentTrack?.public_url) {
      if (tracks.length === 0) {
        player.setActiveItem(null)
      }
      return
    }
    const item = trackToItem(currentTrack)
    player.setActiveItem(item)
    if (playlist.consumeShouldPlayAfterSync()) {
      player.play(item)
    }
  }, [
    playlist.tracks,
    playlist.currentIndex,
    playlist.effectiveIndex,
    playlist.currentTrack,
    player,
  ])

  return null
}

export function GlobalPlaylistProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracksState] = useState<GlobalPlaylistTrack[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [repeatMode, setRepeatModeState] = useState<RepeatMode>("off")
  const [shuffle, setShuffleState] = useState(false)
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([])
  const shouldPlayAfterSyncRef = useRef(false)

  const effectiveIndex =
    shuffle && shuffleOrder.length === tracks.length
      ? shuffleOrder[currentIndex] ?? 0
      : currentIndex
  const currentTrack =
    tracks.length > 0 ? tracks[effectiveIndex] ?? null : null

  const setPlaylist = useCallback(
    (newTracks: GlobalPlaylistTrack[], startIndex?: number) => {
      setTracksState(newTracks)
      const idx =
        startIndex !== undefined
          ? Math.max(0, Math.min(startIndex, newTracks.length - 1))
          : 0
      setCurrentIndex(idx)
      if (newTracks.length > 0) {
        setShuffleOrder(shuffleIndices(newTracks.length))
        shouldPlayAfterSyncRef.current = true
      }
    },
    []
  )

  const next = useCallback(() => {
    if (tracks.length === 0) return
    if (repeatMode === "repeatOne") {
      shouldPlayAfterSyncRef.current = true
      setCurrentIndex((i) => i)
      return
    }
    let nextIdx: number
    if (shuffle && shuffleOrder.length > 0) {
      if (currentIndex >= shuffleOrder.length - 1) {
        nextIdx = repeatMode === "repeatAll" ? 0 : currentIndex
      } else {
        nextIdx = currentIndex + 1
      }
    } else {
      if (currentIndex >= tracks.length - 1) {
        nextIdx = repeatMode === "repeatAll" ? 0 : currentIndex
      } else {
        nextIdx = currentIndex + 1
      }
    }
    shouldPlayAfterSyncRef.current = true
    setCurrentIndex(nextIdx)
  }, [
    tracks.length,
    currentIndex,
    shuffle,
    shuffleOrder.length,
    repeatMode,
  ])

  const prev = useCallback(() => {
    if (tracks.length === 0) return
    let prevIdx: number
    if (shuffle && shuffleOrder.length > 0) {
      prevIdx =
        currentIndex <= 0
          ? repeatMode === "repeatAll"
            ? shuffleOrder.length - 1
            : 0
          : currentIndex - 1
    } else {
      prevIdx =
        currentIndex <= 0
          ? repeatMode === "repeatAll"
            ? tracks.length - 1
            : 0
          : currentIndex - 1
    }
    shouldPlayAfterSyncRef.current = true
    setCurrentIndex(prevIdx)
  }, [tracks.length, currentIndex, shuffle, shuffleOrder.length, repeatMode])

  const setRepeatMode = useCallback((mode: RepeatMode) => {
    setRepeatModeState(mode)
  }, [])

  const setShuffle = useCallback((on: boolean) => {
    setShuffleState(on)
  }, [])

  const consumeShouldPlayAfterSync = useCallback(() => {
    const value = shouldPlayAfterSyncRef.current
    shouldPlayAfterSyncRef.current = false
    return value
  }, [])

  // Rebuild shuffle order when shuffle is turned on or tracks length changes
  useEffect(() => {
    if (shuffle && tracks.length > 0 && shuffleOrder.length !== tracks.length) {
      setShuffleOrder(shuffleIndices(tracks.length))
      setCurrentIndex(0)
    } else if (!shuffle) {
      setShuffleOrder([])
    }
  }, [shuffle, tracks.length])

  const handleEnded = useCallback(() => {
    if (tracks.length === 0) return
    if (repeatMode === "repeatOne" && currentTrack) {
      const playerEl = document.querySelector(
        "audio[data-global-audio]"
      ) as HTMLAudioElement | null
      if (playerEl) {
        playerEl.currentTime = 0
        playerEl.play()
      }
      return
    }
    next()
  }, [tracks.length, repeatMode, currentTrack, next])

  const api: GlobalPlaylistApi = {
    tracks,
    currentIndex,
    repeatMode,
    shuffle,
    setPlaylist,
    next,
    prev,
    setRepeatMode,
    setShuffle,
    effectiveIndex,
    currentTrack,
    consumeShouldPlayAfterSync,
  }

  return (
    <GlobalPlaylistContext.Provider value={api}>
      <AudioPlayerProvider onEnded={handleEnded}>
        <PlaylistSync />
        {children}
      </AudioPlayerProvider>
    </GlobalPlaylistContext.Provider>
  )
}
