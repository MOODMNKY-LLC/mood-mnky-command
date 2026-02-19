"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import {
  AudioPlayer,
  AudioPlayerElement,
  AudioPlayerPlayButton,
  AudioPlayerSeekBackwardButton,
  AudioPlayerSeekForwardButton,
  AudioPlayerTimeDisplay,
  AudioPlayerTimeRange,
  AudioPlayerDurationDisplay,
  AudioPlayerVolumeRange,
} from "@/components/ai-elements/audio-player";
import { Repeat, Repeat1, Shuffle, FileAudio, ListMusic, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useVerseUser } from "@/components/verse/verse-user-context";

export type VerseTrack = {
  id: string;
  public_url: string | null;
  audio_title?: string | null;
  audio_artist?: string | null;
  audio_album?: string | null;
  cover_art_url?: string | null;
  file_name?: string | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function shuffleArray<T>(arr: T[]): number[] {
  const indices = arr.map((_, i) => i);
  const result: number[] = [];
  const pool = [...indices];
  while (pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]!);
  }
  return result;
}

export function DojoMusicPlayer() {
  const user = useVerseUser();
  const isAuthenticated = !!user?.id;

  const { data, error, isLoading, mutate } = useSWR<{ tracks: VerseTrack[] }>(
    isAuthenticated ? "/api/dojo/music" : "/api/verse/music",
    fetcher
  );

  const { data: poolData } = useSWR<{ tracks: VerseTrack[] }>(
    isAuthenticated ? "/api/verse/music" : null,
    fetcher
  );

  const tracks = data?.tracks ?? [];
  const poolTracks = poolData?.tracks ?? [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  type RepeatMode = "off" | "repeatOne" | "repeatAll";
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const isRepeatOne = repeatMode === "repeatOne";
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [replayKey, setReplayKey] = useState(0);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const displayIndex =
    isShuffle && shuffleOrder.length > 0 ? shuffleOrder[currentIndex] ?? 0 : currentIndex;
  const displayTrack = tracks[displayIndex];

  const advanceTrack = useCallback(
    (direction: 1 | -1) => {
      if (tracks.length === 0) return;
      if (isShuffle && shuffleOrder.length > 0) {
        const nextIdx = currentIndex + direction;
        if (nextIdx < 0) setCurrentIndex(shuffleOrder.length - 1);
        else if (nextIdx >= shuffleOrder.length) setCurrentIndex(0);
        else setCurrentIndex(nextIdx);
      } else {
        const next = (displayIndex + direction + tracks.length) % tracks.length;
        setCurrentIndex(next);
      }
    },
    [tracks.length, isShuffle, shuffleOrder, currentIndex, displayIndex]
  );

  const selectTrackByDisplayIndex = useCallback(
    (idx: number) => {
      if (isShuffle && shuffleOrder.length > 0) {
        const pos = shuffleOrder.indexOf(idx);
        setCurrentIndex(pos >= 0 ? pos : 0);
      } else {
        setCurrentIndex(idx);
      }
    },
    [isShuffle, shuffleOrder]
  );

  useEffect(() => {
    if (tracks.length > 0 && isShuffle && shuffleOrder.length !== tracks.length) {
      setShuffleOrder(shuffleArray(tracks));
      setCurrentIndex(0);
    } else if (!isShuffle) {
      setShuffleOrder([]);
    }
  }, [tracks.length, isShuffle]);

  const handleEnded = useCallback(() => {
    if (repeatMode === "repeatOne" && displayTrack) {
      setReplayKey((k) => k + 1);
      return;
    }
    if (tracks.length <= 1) return;
    if (repeatMode === "off") {
      const isLastTrack = isShuffle
        ? currentIndex >= shuffleOrder.length - 1
        : currentIndex >= tracks.length - 1;
      if (isLastTrack) return;
    }
    advanceTrack(1);
  }, [repeatMode, displayTrack, tracks.length, isShuffle, currentIndex, shuffleOrder.length, advanceTrack]);

  useEffect(() => {
    if (editSheetOpen && tracks.length > 0) {
      setSelectedIds(new Set(tracks.map((t) => t.id)));
    }
  }, [editSheetOpen, tracks]);

  const toggleTrackInSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSavePlaylist = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dojo/music/playlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Failed to save");
      }
      await mutate();
      setEditSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        Failed to load playlist.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
        No tracks yet.
      </div>
    );
  }

  return (
    <div className="dojo-music-player flex flex-col gap-2">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-sidebar-accent/50 p-3">
        {/* Large album art (Spotify-style) */}
        <div className="flex justify-center">
          {displayTrack?.cover_art_url ? (
            <img
              src={displayTrack.cover_art_url}
              alt=""
              className="aspect-square w-full max-w-[140px] rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[140px] items-center justify-center rounded-lg bg-muted shadow-inner">
              <FileAudio className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Track title and play status */}
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-medium">
            {displayTrack?.audio_title || displayTrack?.file_name || "Track"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {displayTrack?.audio_artist ?? "Unknown artist"}
            {displayTrack?.audio_album ? ` · ${displayTrack.audio_album}` : ""}
          </p>
        </div>

        <AudioPlayer key={`${displayTrack?.id}-${replayKey}`}>
          <AudioPlayerElement
            src={displayTrack?.public_url ?? ""}
            onEnded={handleEnded}
          />
          {/* Track timers — centered above volume */}
          <div className="flex w-full justify-center py-1">
            <div className="flex items-center gap-1.5 text-[10px] tabular-nums text-muted-foreground">
              <AudioPlayerTimeDisplay className="!p-0 !border-0 !bg-transparent !shadow-none !rounded-none" />
              <span aria-hidden>/</span>
              <AudioPlayerDurationDisplay className="!p-0 !border-0 !bg-transparent !shadow-none !rounded-none" />
            </div>
          </div>

          {/* Volume slider — top, centered */}
          <div className="flex w-full flex-col items-center">
            <div className="flex w-full max-w-[200px] mx-auto">
              <AudioPlayerVolumeRange className="min-w-0 w-full" />
            </div>
          </div>

          {/* Playback controls — Shuffle | Back | Play | Forward | Repeat, all in one row */}
          <div className="flex w-full items-center justify-center gap-2">
            <Button
              variant={isShuffle ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsShuffle(!isShuffle)}
              title={isShuffle ? "Shuffle (on)" : "Shuffle"}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <AudioPlayerSeekBackwardButton />
            <AudioPlayerPlayButton className="!h-12 !w-12" />
            <AudioPlayerSeekForwardButton />
            <Button
              variant={repeatMode !== "off" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => {
                const next: RepeatMode =
                  repeatMode === "off" ? "repeatOne" : repeatMode === "repeatOne" ? "repeatAll" : "off";
                setRepeatMode(next);
              }}
              title={
                repeatMode === "off"
                  ? "Repeat off"
                  : repeatMode === "repeatOne"
                    ? "Repeat one"
                    : "Repeat all"
              }
            >
              {repeatMode === "repeatOne" ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className={cn("h-4 w-4", repeatMode === "off" && "text-muted-foreground")} />
              )}
            </Button>
          </div>

          {/* Progress bar — scrubber only, same width as volume bar */}
          <div className="flex w-full flex-col items-center gap-1">
            <div className="flex w-full max-w-[200px] mx-auto">
              <AudioPlayerTimeRange className="min-w-0 w-full !py-1" />
            </div>
          </div>
        </AudioPlayer>
      </div>

      <Collapsible open={playlistOpen} onOpenChange={setPlaylistOpen}>
        <div className="flex items-center justify-between gap-1">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              {playlistOpen ? (
                <ChevronUp className="mr-1 h-3 w-3" />
              ) : (
                <ChevronDown className="mr-1 h-3 w-3" />
              )}
              Playlist ({tracks.length})
            </Button>
          </CollapsibleTrigger>
          {isAuthenticated && (
            <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-7 w-7" title="Edit playlist">
                  <ListMusic className="h-3.5 w-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Edit playlist</SheetTitle>
                  <SheetDescription>
                    Choose tracks for your Dojo sidebar. Unselected = use full
                    Verse playlist.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="flex flex-col gap-1">
                    {poolTracks.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => toggleTrackInSelection(track.id)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded p-2 text-left transition-colors hover:bg-muted/50",
                          selectedIds.has(track.id) && "bg-muted"
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
                          <p className="truncate text-sm">
                            {track.audio_title || track.file_name || "Track"}
                          </p>
                          {track.audio_artist && (
                            <p className="truncate text-xs text-muted-foreground">
                              {track.audio_artist}
                            </p>
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-xs",
                            selectedIds.has(track.id)
                              ? "text-primary"
                              : "text-muted-foreground"
                          )}
                        >
                          {selectedIds.has(track.id) ? "On" : "Off"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={handleSavePlaylist}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditSheetOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
        <CollapsibleContent>
          <div className="max-h-[120px] overflow-y-auto rounded border border-border">
            {tracks.map((track, idx) => {
              const isActive =
                isShuffle
                  ? shuffleOrder[currentIndex] === idx
                  : currentIndex === idx;
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
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted">
                      <FileAudio className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs">
                      {track.audio_title || track.file_name || "Track"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
