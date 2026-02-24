"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Music, Disc3, Play, Pause } from "lucide-react"
import { Marquee } from "@/components/ui/marquee"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { useAudioPlayer } from "@/components/ui/audio-player"
import { cn } from "@/lib/utils"
import type { MainMediaAudioTrack } from "@/lib/main-media-data"
import type { JellyfinFeaturedItem } from "@/lib/services/jellyfin"

type MnkyMusikProps = {
  variant: "mnky-musik"
  tracks: MainMediaAudioTrack[]
  /** Optional 3D-style wrapper: perspective + subtle rotateX/rotateY for depth. */
  enable3D?: boolean
}

type JellyfinMusicProps = {
  variant: "jellyfin-music"
  jellyfinItems: JellyfinFeaturedItem[]
  jellyfinBaseUrl: string | undefined
  /** Optional 3D-style wrapper: perspective + subtle rotateX/rotateY for depth. */
  enable3D?: boolean
}

export type MediaMusicMarqueeProps = MnkyMusikProps | JellyfinMusicProps

export function MediaMusicMarquee(props: MediaMusicMarqueeProps) {
  if (props.variant === "mnky-musik") {
    return <MnkyMusikMarquee tracks={props.tracks} enable3D={props.enable3D} />
  }
  return (
    <JellyfinMusicMarquee
      jellyfinItems={props.jellyfinItems}
      jellyfinBaseUrl={props.jellyfinBaseUrl}
      enable3D={props.enable3D}
    />
  )
}

function Marquee3DWrapper({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn("relative flex w-full flex-col items-center justify-center overflow-hidden [perspective:320px]", className)}
      style={{ minHeight: 280 }}
    >
      <div className="marquee-3d-inner flex w-full justify-center transition-transform duration-300 ease-out">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}

function MnkyMusikMarquee({
  tracks,
  enable3D = false,
}: {
  tracks: MainMediaAudioTrack[]
  enable3D?: boolean
}) {
  const player = useAudioPlayer<{ track?: MainMediaAudioTrack }>()
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const playingId = player.activeItem?.id ?? null
  const isPlaying = player.isPlaying

  const handlePlay = useCallback(
    (track: MainMediaAudioTrack) => {
      const url = track.public_url?.trim()
      if (!url) return
      player.setActiveItem({
        id: track.id,
        src: url,
        data: { track },
      })
      player.play()
    },
    [player]
  )

  const handlePause = useCallback(() => {
    player.pause()
  }, [player])

  const handleEnded = useCallback(() => {
    // Global player keeps last track in bar; no-op here
  }, [])

  const marqueeStrip = (
    <Marquee
      pauseOnHover
      paused={playingId !== null || hoveredId !== null}
      className="[--duration:140s]"
    >
      {tracks.map((t) => (
        <TrackCard
          key={t.id}
          track={t}
          isPlaying={playingId === t.id && isPlaying}
          isHovered={hoveredId === t.id}
          onHoverStart={() => setHoveredId(t.id)}
          onHoverEnd={() => setHoveredId(null)}
          onPlay={() => handlePlay(t)}
          onPause={handlePause}
          onEnded={handleEnded}
        />
      ))}
    </Marquee>
  )

  const wrapperContent = <>{marqueeStrip}</>

  if (enable3D) {
    return <Marquee3DWrapper>{wrapperContent}</Marquee3DWrapper>
  }
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden" style={{ minHeight: 280 }}>
      {wrapperContent}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-background to-transparent" />
    </div>
  )
}

interface TrackCardProps {
  track: MainMediaAudioTrack
  isPlaying: boolean
  isHovered: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onPlay: (id: string) => void
  onPause: () => void
  onEnded: () => void
}

function TrackCard({
  track,
  isPlaying,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onPlay,
  onPause,
}: TrackCardProps) {
  const handleClick = useCallback(() => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }, [isPlaying, onPlay, onPause])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick]
  )

  const title = track.audio_title || track.file_name
  const ariaLabel = isPlaying ? `Pause ${title}` : `Play ${title}`

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 transition-transform duration-200 rounded-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isPlaying ? "w-[180px] sm:w-[200px] z-10 ring-2 ring-primary/30 shadow-lg" : "w-[200px] sm:w-[220px]"
      )}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <MainGlassCard className="main-glass-panel-card overflow-hidden p-0 h-full">
        <div className="relative aspect-square w-full bg-muted">
          {track.cover_art_url ? (
            <img
              src={track.cover_art_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Music className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {/* Centered play overlay when hovered and not playing */}
          {isHovered && !isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
              <div className="rounded-full bg-primary/90 p-3 text-primary-foreground">
                <Play className="h-8 w-8 fill-current" />
              </div>
            </div>
          )}
          {/* Large play/pause overlay when playing (forward card) */}
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
              <div className="rounded-full bg-primary/90 p-4 text-primary-foreground">
                <Pause className="h-10 w-10 fill-current" />
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 backdrop-blur-[2px]">
            <p className="truncate font-medium text-white text-sm drop-shadow">
              {title}
            </p>
            {track.audio_artist && (
              <p className="truncate text-xs text-white/90 drop-shadow">
                {track.audio_artist}
              </p>
            )}
            {track.audio_album && (
              <p className="truncate text-xs text-white/70 drop-shadow">
                {track.audio_album}
              </p>
            )}
          </div>
        </div>
        {/* Playback is handled by global AudioPlayerProvider and PersistentPlayerBar */}
      </MainGlassCard>
    </div>
  )
}

function JellyfinMusicMarquee({
  jellyfinItems,
  jellyfinBaseUrl,
  enable3D = false,
}: {
  jellyfinItems: JellyfinFeaturedItem[]
  jellyfinBaseUrl: string | undefined
  enable3D?: boolean
}) {
  const marquee = (
    <Marquee pauseOnHover className="[--duration:80s]">
      {jellyfinItems.map((item) => (
        <div
          key={item.id}
          className="w-[180px] shrink-0 sm:w-[200px]"
        >
          <MainGlassCard className="main-glass-panel-card overflow-hidden p-0 h-full">
            <div className="relative aspect-square w-full bg-muted">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Disc3 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 backdrop-blur-[2px]">
                <p className="truncate font-medium text-white text-sm drop-shadow">
                  {item.name}
                </p>
                {item.overview && (
                  <p className="line-clamp-2 text-xs text-white/90 drop-shadow">
                    {item.overview}
                  </p>
                )}
                {jellyfinBaseUrl && (
                  <a
                    href={`${jellyfinBaseUrl}/web/index.html#!/item?id=${item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-white/95 hover:underline font-medium"
                  >
                    Open in Jellyfin →
                  </a>
                )}
              </div>
            </div>
          </MainGlassCard>
        </div>
      ))}
    </Marquee>
  )

  if (enable3D) {
    return <Marquee3DWrapper>{marquee}</Marquee3DWrapper>
  }
  return marquee
}
