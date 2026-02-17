"use client"

import { useState, useMemo } from "react"
import { FileAudio, ChevronUp, ChevronDown, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { MediaAsset } from "@/lib/supabase/storage"

type PlaylistEntry = {
  id: string
  media_asset_id: string
  sort_order: number
  asset?: MediaAsset | null
}

export interface VerseMusicPlaylistBuilderProps {
  uploadedTracks: MediaAsset[]
  versePlaylist: PlaylistEntry[]
  onAdd: (mediaAssetId: string) => Promise<void>
  onRemove: (mediaAssetId: string) => Promise<void>
  onMoveUp: (idx: number) => Promise<void>
  onMoveDown: (idx: number) => Promise<void>
}

export function VerseMusicPlaylistBuilder({
  uploadedTracks,
  versePlaylist,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
}: VerseMusicPlaylistBuilderProps) {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [movingId, setMovingId] = useState<string | null>(null)

  const playlistAssetIds = useMemo(
    () => new Set(versePlaylist.map((p) => p.media_asset_id)),
    [versePlaylist]
  )

  const filteredTracks = useMemo(() => {
    if (!search.trim()) return uploadedTracks
    const q = search.toLowerCase().trim()
    return uploadedTracks.filter(
      (a) =>
        (a.audio_title ?? a.file_name ?? "").toLowerCase().includes(q) ||
        (a.audio_artist ?? "").toLowerCase().includes(q) ||
        (a.audio_album ?? "").toLowerCase().includes(q) ||
        (a.file_name ?? "").toLowerCase().includes(q)
    )
  }, [uploadedTracks, search])

  const inPlaylistOrdered = useMemo(
    () =>
      versePlaylist
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((p) => p.asset)
        .filter(Boolean) as MediaAsset[],
    [versePlaylist]
  )

  const handleToggle = async (assetId: string, inPlaylist: boolean) => {
    setTogglingId(assetId)
    try {
      if (inPlaylist) {
        await onRemove(assetId)
        toast({ title: "Removed from playlist" })
      } else {
        await onAdd(assetId)
        toast({ title: "Added to playlist" })
      }
    } catch (err) {
      toast({
        title: "Failed",
        description: err instanceof Error ? err.message : "Could not update playlist",
        variant: "destructive",
      })
    } finally {
      setTogglingId(null)
    }
  }

  const handleMove = async (
    direction: "up" | "down",
    assetId: string,
    idx: number
  ) => {
    setMovingId(assetId)
    try {
      if (direction === "up") await onMoveUp(idx)
      else await onMoveDown(idx)
    } catch (err) {
      toast({
        title: "Failed to reorder",
        description: err instanceof Error ? err.message : "Could not move track",
        variant: "destructive",
      })
    } finally {
      setMovingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, artist, or album..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {versePlaylist.length} of {uploadedTracks.length} tracks in playlist
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Tracks — toggle to add or remove from playlist</CardTitle>
          <p className="text-xs text-muted-foreground">
            Use the switch to include tracks. Reorder with ↑↓ when in playlist.
          </p>
        </CardHeader>
        <CardContent>
          {filteredTracks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {uploadedTracks.length === 0
                ? "No tracks uploaded yet. Upload above in the Upload tab."
                : "No tracks match your search."}
            </p>
          ) : (
            <ScrollArea className="h-[min(55vh,420px)] pr-3">
              <div className="flex flex-col gap-1.5">
                {filteredTracks.map((asset) => {
                  const inPlaylist = playlistAssetIds.has(asset.id)
                  const playlistIdx = versePlaylist.findIndex(
                    (p) => p.media_asset_id === asset.id
                  )
                  const isFirst = playlistIdx === 0
                  const isLast = playlistIdx === versePlaylist.length - 1

                  return (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        inPlaylist
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-card"
                      }`}
                    >
                      {/* Cover art */}
                      {asset.cover_art_url ? (
                        <img
                          src={asset.cover_art_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-muted">
                          <FileAudio className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {asset.audio_title || asset.file_name || "Untitled"}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {asset.audio_artist ?? "Unknown artist"}
                          {asset.audio_album ? ` · ${asset.audio_album}` : ""}
                        </p>
                      </div>

                      {/* Reorder (only when in playlist) */}
                      {inPlaylist && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            #{playlistIdx + 1}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMove("up", asset.id, playlistIdx)}
                            disabled={isFirst || movingId === asset.id}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleMove("down", asset.id, playlistIdx)}
                            disabled={isLast || movingId === asset.id}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {/* Toggle */}
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">
                          {inPlaylist ? "In playlist" : "Off"}
                        </span>
                        <Switch
                          checked={inPlaylist}
                          onCheckedChange={() => handleToggle(asset.id, inPlaylist)}
                          disabled={togglingId === asset.id}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Compact preview of playlist order */}
      {inPlaylistOrdered.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Playlist preview</CardTitle>
            <p className="text-xs text-muted-foreground">
              Order shown on Verse /music page
            </p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(20vh,160px)] pr-3">
              <div className="flex flex-col gap-1">
                {inPlaylistOrdered.map((asset, idx) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-2 rounded border border-border bg-muted/30 px-2 py-1.5"
                  >
                    <span className="w-5 text-right text-xs text-muted-foreground">
                      {idx + 1}.
                    </span>
                    {asset.cover_art_url ? (
                      <img
                        src={asset.cover_art_url}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <FileAudio className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate text-xs">
                      {asset.audio_title || asset.file_name || "Untitled"}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
