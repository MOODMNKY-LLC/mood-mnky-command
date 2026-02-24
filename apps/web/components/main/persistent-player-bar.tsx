"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Pause, ChevronUp, ChevronDown, X, Info } from "lucide-react"
import { useAudioPlayer, useAudioPlayerTime } from "@/components/ui/audio-player"
import { AudioPlayerProgress } from "@/components/ui/audio-player"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const STORAGE_KEY_HIDDEN = "mnky-persistent-player-hidden"
const STORAGE_KEY_COLLAPSED = "mnky-persistent-player-collapsed"

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

export function PersistentPlayerBar() {
  const player = useAudioPlayer<{ track?: MainMediaAudioTrack }>()
  const time = useAudioPlayerTime()
  const [hidden, setHidden] = useState(true)
  const [collapsed, setCollapsed] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setHidden(getStoredHidden())
    setCollapsed(getStoredCollapsed())
  }, [])

  // When user plays a track (e.g. from media page), show the bar even if they had hidden it before
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

  const activeItem = player.activeItem
  const track = activeItem?.data?.track as MainMediaAudioTrack | undefined
  const showBar = mounted && !hidden && activeItem !== null

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
      <div className="main-container flex items-center gap-3 px-4">
        {/* Play/Pause + optional art in collapsed mode */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
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

        {/* Collapsed: progress + collapse/hide */}
        {collapsed && (
          <>
            <div className="hidden min-w-[120px] flex-1 md:block">
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
