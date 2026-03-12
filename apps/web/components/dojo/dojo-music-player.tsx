"use client";

import { useState, useCallback, useEffect } from "react";
import useSWR from "swr";
import { FileAudio, ListMusic, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
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
import {
  useGlobalPlaylist,
  type GlobalPlaylistTrack,
} from "@/components/main/global-playlist-context";

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

function toGlobalTrack(t: VerseTrack): GlobalPlaylistTrack {
  return {
    id: t.id,
    public_url: t.public_url,
    audio_title: t.audio_title ?? null,
    audio_artist: t.audio_artist ?? null,
    audio_album: t.audio_album ?? null,
    cover_art_url: t.cover_art_url ?? null,
    file_name: t.file_name ?? null,
  };
}

export function DojoMusicPlayer() {
  const user = useVerseUser();
  const isAuthenticated = !!user?.id;
  const playlist = useGlobalPlaylist();

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
  const globalTracks = tracks.map(toGlobalTrack);

  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const handlePlayTrack = useCallback(
    (index: number) => {
      if (globalTracks.length === 0) return
      playlist.setPlaylist(globalTracks, index)
    },
    [globalTracks, playlist]
  );

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

  const nowPlaying =
    playlist.currentTrack &&
    globalTracks.some((t) => t.id === playlist.currentTrack?.id)
      ? playlist.currentTrack
      : null

  return (
    <div className="dojo-music-player flex flex-col gap-2">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-sidebar-accent/50 p-3">
        {/* Now playing: cover + title (playback is in global bar) */}
        <div className="flex justify-center">
          {(nowPlaying ?? globalTracks[0])?.cover_art_url ? (
            <img
              src={(nowPlaying ?? globalTracks[0])?.cover_art_url ?? ""}
              alt=""
              className="aspect-square w-full max-w-[140px] rounded-lg object-cover shadow-md"
            />
          ) : (
            <div className="flex aspect-square w-full max-w-[140px] items-center justify-center rounded-lg bg-muted shadow-inner">
              <FileAudio className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-medium">
            {(nowPlaying ?? globalTracks[0])?.audio_title ||
              (nowPlaying ?? globalTracks[0])?.file_name ||
              "Track"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {(nowPlaying ?? globalTracks[0])?.audio_artist ?? "Unknown artist"}
            {(nowPlaying ?? globalTracks[0])?.audio_album
              ? ` · ${(nowPlaying ?? globalTracks[0])?.audio_album}`
              : ""}
          </p>
        </div>
        <p className="text-center text-[10px] text-muted-foreground">
          Playback continues in the bar below when you navigate away.
        </p>
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  title="Edit playlist"
                >
                  <ListMusic className="h-3.5 w-3.5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Edit playlist</SheetTitle>
                  <SheetDescription>
                    Choose tracks for your Dojo sidebar. Unselected = use full
                    MNKY DOJO playlist.
                  </SheetDescription>
                </SheetHeader>
                <div className="relative flex-1 min-h-0 py-4">
                  <div className="h-full overflow-y-auto">
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
                  <ProgressiveBlur position="bottom" height="35%" />
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
          <div className="relative max-h-[120px]">
            <div className="max-h-[120px] overflow-y-auto rounded border border-border">
              {globalTracks.map((track, idx) => {
                const isActive =
                  nowPlaying != null && playlist.currentTrack?.id === track.id
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => handlePlayTrack(idx)}
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
            <ProgressiveBlur position="bottom" height="40%" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
