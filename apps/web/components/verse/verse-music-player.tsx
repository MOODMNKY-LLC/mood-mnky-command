"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR from "swr"
import {
  AudioPlayer,
  AudioPlayerElement,
  AudioPlayerControlBar,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerDurationDisplay,
  AudioPlayerMuteButton,
  AudioPlayerVolumeRange,
} from "@/components/ai-elements/audio-player"
import { Repeat1, Shuffle, FileAudio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"
import { cn } from "@/lib/utils"

export type VerseTrack = {
  id: string
  public_url: string | null
  audio_title?: string | null
  audio_artist?: string | null
  audio_album?: string | null
  cover_art_url?: string | null
  file_name?: string | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function shuffleArray<T>(arr: T[], excludeIndex?: number): number[] {
  const indices = arr.map((_, i) => i)
  const result: number[] = []
  const pool = [...indices]
  while (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0]!)
  }
  return result
}

export function VerseMusicPlayer() {
  const { data, error, isLoading } = useSWR<{ tracks: VerseTrack[] }>(
    "/api/verse/music",
    fetcher
  )
  const tracks = data?.tracks ?? []

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRepeatOne, setIsRepeatOne] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([])
  const [replayKey, setReplayKey] = useState(0)

  const displayIndex = isShuffle && shuffleOrder.length > 0
    ? shuffleOrder[currentIndex] ?? 0
    : currentIndex
  const displayTrack = tracks[displayIndex]

  const advanceTrack = useCallback(
    (direction: 1 | -1) => {
      if (tracks.length === 0) return
      let next: number
      if (isShuffle && shuffleOrder.length > 0) {
        const nextIdx = currentIndex + direction
        if (nextIdx < 0) next = shuffleOrder.length - 1
        else if (nextIdx >= shuffleOrder.length) next = 0
        else next = nextIdx
        setCurrentIndex(next)
      } else {
        next = (displayIndex + direction + tracks.length) % tracks.length
        setCurrentIndex(next)
      }
    },
    [tracks.length, isShuffle, shuffleOrder, currentIndex, displayIndex]
  )

  const selectTrackByDisplayIndex = useCallback(
    (idx: number) => {
      if (isShuffle && shuffleOrder.length > 0) {
        const pos = shuffleOrder.indexOf(idx)
        setCurrentIndex(pos >= 0 ? pos : 0)
      } else {
        setCurrentIndex(idx)
      }
    },
    [isShuffle, shuffleOrder]
  )

  useEffect(() => {
    if (tracks.length > 0 && isShuffle && shuffleOrder.length !== tracks.length) {
      setShuffleOrder(shuffleArray(tracks))
      setCurrentIndex(0)
    } else if (!isShuffle) {
      setShuffleOrder([])
    }
  }, [tracks.length, isShuffle])

  const handleEnded = useCallback(() => {
    if (isRepeatOne && displayTrack) {
      setReplayKey((k) => k + 1)
      return
    }
    if (tracks.length <= 1) return
    advanceTrack(1)
  }, [isRepeatOne, displayTrack, tracks.length, advanceTrack])

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Failed to load playlist.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        Loading playlist…
      </div>
    )
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
        No tracks in the playlist yet.
      </div>
    )
  }

  return (
    <div className="verse-music-player flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-background/50 p-4">
        <div className="flex items-center gap-4">
          {displayTrack?.cover_art_url ? (
            <img
              src={displayTrack.cover_art_url}
              alt=""
              className="h-20 w-20 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded bg-muted">
              <FileAudio className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{displayTrack?.audio_title || displayTrack?.file_name || "Track"}</p>
            {displayTrack?.audio_artist && (
              <p className="truncate text-sm text-muted-foreground">{displayTrack.audio_artist}</p>
            )}
          </div>
        </div>

        <AudioPlayer key={`${displayTrack?.id}-${replayKey}`}>
          <AudioPlayerElement
            src={displayTrack?.public_url ?? ""}
            onEnded={handleEnded}
          />
          <AudioPlayerControlBar>
            <Button
              variant={isRepeatOne ? "secondary" : "outline"}
              size="icon-sm"
              onClick={() => setIsRepeatOne(!isRepeatOne)}
              title={isRepeatOne ? "Repeat one (on)" : "Repeat one"}
            >
              <Repeat1 className="h-4 w-4" />
            </Button>
            <Button
              variant={isShuffle ? "secondary" : "outline"}
              size="icon-sm"
              onClick={() => setIsShuffle(!isShuffle)}
              title={isShuffle ? "Shuffle (on)" : "Shuffle"}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <AudioPlayerSeekBackwardButton />
            <AudioPlayerPlayButton />
            <AudioPlayerSeekForwardButton />
            <AudioPlayerTimeDisplay />
            <AudioPlayerTimeRange />
            <AudioPlayerDurationDisplay />
            <AudioPlayerMuteButton />
            <AudioPlayerVolumeRange />
          </AudioPlayerControlBar>
        </AudioPlayer>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">Playlist</p>
        <div className="relative max-h-48">
          <div className="max-h-48 overflow-y-auto rounded border border-border">
          {tracks.map((track, idx) => {
            const isActive = isShuffle
              ? shuffleOrder[currentIndex] === idx
              : currentIndex === idx
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => selectTrackByDisplayIndex(idx)}
                className={cn(
                  "flex w-full items-center gap-2 p-2 text-left transition-colors hover:bg-muted/50",
                  isActive && "bg-muted"
                )}
              >
                {track.cover_art_url ? (
                  <img
                    src={track.cover_art_url}
                    alt=""
                    className="h-8 w-8 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted">
                    <FileAudio className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{track.audio_title || track.file_name || "Track"}</p>
                  {track.audio_artist && (
                    <p className="truncate text-xs text-muted-foreground">{track.audio_artist}</p>
                  )}
                </div>
              </button>
            )
          })}
          </div>
          <ProgressiveBlur position="bottom" height="40%" />
        </div>
      </div>
    </div>
  )
}
