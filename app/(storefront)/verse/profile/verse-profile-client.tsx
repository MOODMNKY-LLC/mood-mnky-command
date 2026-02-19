"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut, FileAudio, Trash2, Loader2 } from "lucide-react";
import { AGENT_DISPLAY_NAME } from "@/lib/verse-blog";
import { isAgentSlug } from "@/lib/agents";
import { VerseAudioDropzone } from "@/components/verse/verse-audio-dropzone";
import type { MediaAsset } from "@/lib/supabase/storage";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DISPLAY_NAMES: Record<string, string> = {
  mood_mnky: "MOOD MNKY",
  sage_mnky: "SAGE MNKY",
  code_mnky: "CODE MNKY",
};

export function VerseProfileClient({
  email,
  displayName,
  defaultAgentSlug = "mood_mnky",
}: {
  email: string;
  displayName?: string;
  defaultAgentSlug?: string;
}) {
  const router = useRouter();

  const verseTracksParams = new URLSearchParams();
  verseTracksParams.set("bucket", "mnky-verse-tracks");
  verseTracksParams.set("limit", "200");
  const { data: verseTracksData, mutate: mutateVerseTracks } = useSWR<{
    assets: MediaAsset[];
    count: number;
  }>(`/api/media?${verseTracksParams.toString()}`, fetcher);
  const myTracks = verseTracksData?.assets ?? []
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)

  const defaultAgentName = isAgentSlug(defaultAgentSlug)
    ? AGENT_DISPLAY_NAME[defaultAgentSlug]
    : DISPLAY_NAMES[defaultAgentSlug] ?? "MOOD MNKY";

  const handleDeleteTrack = async (assetId: string) => {
    setDeletingAssetId(assetId)
    try {
      const res = await fetch(`/api/media/${assetId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete")
      }
      mutateVerseTracks()
      globalMutate("/api/media")
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to delete track")
    } finally {
      setDeletingAssetId(null)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Profile
        </h1>
        <p className="mt-1 text-sm text-verse-text-muted">
          Account settings and preferences.
        </p>
      </div>
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            Default Agent
          </h2>
        </CardHeader>
        <CardContent>
          <p className="text-verse-text">{defaultAgentName}</p>
          <Button variant="outline" size="sm" asChild className="mt-2">
            <Link href="/dojo/preferences">Change in Dojo</Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            My Tracks
          </h2>
          <p className="text-sm text-verse-text-muted">
            Upload and manage your audio tracks (Suno, etc.). Max 50 MB per file.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <VerseAudioDropzone
            maxFiles={100}
            compact
            onUploadComplete={() => {
              mutateVerseTracks();
              globalMutate("/api/media");
            }}
          />
          {myTracks.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-verse-text/10">
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Your tracks ({myTracks.length})
              </span>
              <div
                className="flex flex-col gap-2 overflow-y-auto pr-1"
                style={{ maxHeight: "min(50vh, 400px)" }}
              >
                {myTracks.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex flex-col gap-1 rounded-lg border border-verse-text/15 bg-verse-bg/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      {asset.cover_art_url ? (
                        <img
                          src={asset.cover_art_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <FileAudio className="h-4 w-4 shrink-0 text-verse-text-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-sm font-medium text-verse-text">
                          {asset.audio_title || asset.file_name}
                        </span>
                        {asset.audio_artist && (
                          <p className="truncate text-xs text-verse-text-muted">
                            {asset.audio_artist}
                            {asset.audio_album ? ` · ${asset.audio_album}` : ""}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTrack(asset.id)}
                        disabled={deletingAssetId === asset.id}
                        title="Delete track"
                      >
                        {deletingAssetId === asset.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {asset.public_url && (
                      <audio
                        controls
                        src={asset.public_url}
                        className="h-8 w-full text-verse-text"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            Account
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayName && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Display name
              </span>
              <p className="text-verse-text">{displayName}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
              Email
            </span>
            <p className="text-verse-text">{email}</p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/update-password">Update password</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-verse-text"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
