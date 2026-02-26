"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
  X,
  Info,
  SkipBack,
  SkipForward,
  Repeat1,
  Repeat,
  Shuffle,
  Volume2,
} from "lucide-react"
import { useAudioPlayer, useAudioPlayerTime } from "@/components/ui/audio-player"
import { AudioPlayerProgress } from "@/components/ui/audio-player"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useGlobalPlaylist, type RepeatMode } from "@/components/main/global-playlist-context"

const STORAGE_KEY_HIDDEN = "mnky-persistent-player-hidden"
const STORAGE_KEY_COLLAPSED = "mnky-persistent-player-collapsed"
const STORAGE_KEY_VOLUME = "mnky-persistent-player-volume"

export type MainMediaAudioTrack = {
  id: string
  public_url: string | null
  audio_title: string | null
  audio_artist: string | null
  audio_album: string | null
  cover_art_url: string | null
  file_name: string
  duration_seconds: number | null
  sort_order: number
}

function getStoredHidden(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY_HIDDEN) === "true"
  } catch {
    return false
  }
}

function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) !== "false"
  } catch {
    return true
  }
}

function getStoredVolume(): number {
  if (typeof window === "undefined") return 1
  try {
    const v = parseFloat(localStorage.getItem(STORAGE_KEY_VOLUME) ?? "1")
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1
  } catch {
    return 1
  }
}

function setStoredHidden(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_HIDDEN, String(value))
  } catch {}
}

function setStoredCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY_COLLAPSED, String(value))
  } catch {}
}

function setStoredVolume(value: number) {
  try {
    localStorage.setItem(STORAGE_KEY_VOLUME, String(value))
  } catch {}
}

function getGlobalAudio(): HTMLAudioElement | null {
  if (typeof document === "undefined") return null
  return document.querySelector("audio[data-global-audio]")
}

function cycleMode(current: RepeatMode, shuffle: boolean): RepeatMode | "shuffle" {
  if (current === "repeatOne") return "repeatAll"
  if (current === "repeatAll") return "shuffle"
  return "repeatOne"
}

export function PersistentPlayerBar() {
  const player = useAudioPlayer<{ track?: MainMediaAudioTrack }>()
  const playlist = useGlobalPlaylist()
  const [hidden, setHidden] = useState(true)
  const [collapsed, setCollapsed] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [volume, setVolumeState] = useState(1)

  useEffect(() => {
    setMounted(true)
    setHidden(getStoredHidden())
    setCollapsed(getStoredCollapsed())
    setVolumeState(getStoredVolume())
  }, [])

  useEffect(() => {
    const el = getGlobalAudio()
    if (el) {
      el.volume = volume
      setStoredVolume(volume)
    }
  }, [volume])

  useEffect(() => {
    if (player.activeItem !== null) setHidden(false)
  }, [player.activeItem])

  const handleHide = useCallback(() => {
    setHidden(true)
    setStoredHidden(true)
  }, [])

  const handleCollapse = useCallback(() => {
    setCollapsed(true)
    setStoredCollapsed(true)
    setExpanded(false)
  }, [])

  const handleExpand = useCallback(() => {
    setCollapsed(false)
    setStoredCollapsed(false)
  }, [])

  const toggleExpanded = useCallback(() => {
    setExpanded((e) => !e)
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    const v = value[0] ?? 1
    setVolumeState(v)
  }, [])

  const handleCycleMode = useCallback(() => {
    const next = cycleMode(playlist.repeatMode, playlist.shuffle)
    if (next === "shuffle") {
      playlist.setRepeatMode("off")
      playlist.setShuffle(true)
    } else {
      playlist.setShuffle(false)
      playlist.setRepeatMode(next)
    }
  }, [playlist])

  const activeItem = player.activeItem
  const track = activeItem?.data?.track as MainMediaAudioTrack | undefined
  const showBar = mounted && !hidden && activeItem !== null
  const hasPlaylist = playlist.tracks.length > 0
  const cycleLabel =
    playlist.repeatMode === "repeatOne"
      ? "Repeat one"
      : playlist.repeatMode === "repeatAll"
        ? "Repeat all"
        : playlist.shuffle
          ? "Shuffle"
          : "Play mode"

  if (!mounted) return null
  if (!showBar) return null

  const title = track?.audio_title || track?.file_name || "MNKY MUSIK"
  const artist = track?.audio_artist ?? null
  const coverUrl = track?.cover_art_url ?? null

  return (
    <div
      className={cn(
        "main-glass-panel fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md transition-all duration-200",
        collapsed ? "py-2" : "py-3"
      )}
      role="region"
      aria-label="Global audio player"
    >
      <div className="main-container flex items-center gap-2 px-4 sm:gap-3">
        {/* Skip prev (when playlist) + Play/Pause + Skip next (when playlist) + optional art */}
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
          {hasPlaylist && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => playlist.prev()}
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-foreground hover:bg-muted"
            onClick={() => (player.isPlaying ? player.pause() : player.play())}
            aria-label={player.isPlaying ? "Pause" : "Play"}
          >
            {player.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          {hasPlaylist && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => playlist.next()}
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
          {coverUrl && collapsed && (
            <img
              src={coverUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded object-cover"
              width={36}
              height={36}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{title}</p>
            {artist && (
              <p className="truncate text-xs text-muted-foreground">{artist}</p>
            )}
          </div>
        </div>

        {/* Cycle mode (repeat one / repeat all / shuffle) */}
        {hasPlaylist && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleCycleMode}
            aria-label={cycleLabel}
            title={cycleLabel}
          >
            {playlist.repeatMode === "repeatOne" ? (
              <Repeat1 className="h-4 w-4 text-primary" />
            ) : playlist.shuffle ? (
              <Shuffle className="h-4 w-4 text-primary" />
            ) : (
              <Repeat
                className={cn(
                  "h-4 w-4",
                  playlist.repeatMode === "repeatAll" && "text-primary"
                )}
              />
            )}
          </Button>
        )}

        {/* Volume popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Volume"
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-40 p-3" align="end">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
                aria-label="Volume"
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Collapsed: progress + expand/hide */}
        {collapsed && (
          <>
            <div className="hidden min-w-[100px] flex-1 md:block">
              <AudioPlayerProgress className="w-full" />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleExpand}
                aria-label="Expand player"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleHide}
                aria-label="Hide player"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Expanded: art + metadata + progress + collapse */}
        {!collapsed && (
          <>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start gap-3">
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded object-cover"
                    width={64}
                    height={64}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{title}</p>
                  {artist && (
                    <p className="text-sm text-muted-foreground">{artist}</p>
                  )}
                  {track?.audio_album && (
                    <p className="text-xs text-muted-foreground">
                      {track.audio_album}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={toggleExpanded}
                  aria-label={expanded ? "Less info" : "More info"}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
              <AudioPlayerProgress className="w-full" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleCollapse}
              aria-label="Collapse player"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
