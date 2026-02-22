"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Save, Sparkles } from "lucide-react"
import type { MainElevenLabsConfigGet } from "@/app/api/main/elevenlabs-config/route"
import type { MainAudioLibraryTrack } from "@/app/api/main/audio-library/route"

const EMPTY_LIBRARY_ID = "__none__"

export default function MainElevenLabsConfigPage() {
  const [config, setConfig] = useState<MainElevenLabsConfigGet | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [libraryTracks, setLibraryTracks] = useState<MainAudioLibraryTrack[]>([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [selectedLibraryTrackId, setSelectedLibraryTrackId] = useState<string>(EMPTY_LIBRARY_ID)

  const [agentId, setAgentId] = useState("")
  const [defaultVoiceId, setDefaultVoiceId] = useState("")
  const [audioSampleUrl, setAudioSampleUrl] = useState("")
  const [showVoiceSection, setShowVoiceSection] = useState(true)
  const [showAudioSample, setShowAudioSample] = useState(true)
  const [connectionType, setConnectionType] = useState<"webrtc" | "websocket">("webrtc")
  const [showTranscriptViewer, setShowTranscriptViewer] = useState(false)
  const [showWaveformInVoiceBlock, setShowWaveformInVoiceBlock] = useState(false)

  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true)
    try {
      const res = await fetch("/api/main/audio-library")
      if (!res.ok) return
      const data: { tracks: MainAudioLibraryTrack[] } = await res.json()
      setLibraryTracks((data.tracks ?? []).filter((t) => t.public_url?.trim()))
    } finally {
      setLibraryLoading(false)
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/main/elevenlabs-config")
      if (!res.ok) throw new Error("Failed to load config")
      const data: MainElevenLabsConfigGet = await res.json()
      setConfig(data)
      setAgentId(data.agentId ?? "")
      setDefaultVoiceId(data.defaultVoiceId ?? "")
      setAudioSampleUrl(data.audioSampleUrl ?? "")
      setShowVoiceSection(data.showVoiceSection ?? true)
      setShowAudioSample(data.showAudioSample ?? true)
      setConnectionType(data.connectionType ?? "webrtc")
      setShowTranscriptViewer(data.showTranscriptViewer ?? false)
      setShowWaveformInVoiceBlock(data.showWaveformInVoiceBlock ?? false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load config")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
    fetchLibrary()
  }, [fetchConfig, fetchLibrary])

  const hasSyncedLibraryRef = useRef(false)
  useEffect(() => {
    if (libraryLoading || !config || hasSyncedLibraryRef.current) return
    hasSyncedLibraryRef.current = true
    const url = config.audioSampleUrl?.trim()
    const match = libraryTracks.find((t) => t.public_url === url)
    setSelectedLibraryTrackId(match ? match.id : EMPTY_LIBRARY_ID)
  }, [config, libraryTracks, libraryLoading])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/main/elevenlabs-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentId.trim() || undefined,
          defaultVoiceId: defaultVoiceId.trim() || undefined,
          audioSampleUrl: audioSampleUrl.trim() || null,
          showVoiceSection,
          showAudioSample,
          connectionType,
          showTranscriptViewer,
          showWaveformInVoiceBlock,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error((d as { error?: string }).error ?? "Failed to save")
      }
      setSuccess("Main ElevenLabs config saved.")
      fetchConfig()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save config")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Main ElevenLabs</h1>
          <p className="text-sm text-muted-foreground">
            Configure voice and audio for the Main landing page (public).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Main landing voice &amp; listen</CardTitle>
          <CardDescription>
            Agent ID powers the &quot;Talk to MOOD MNKY&quot; voice block. Audio sample URL is used in the &quot;Listen&quot; section. No API keys are stored here; keep them server-side only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="main-agentId">Main agent ID</Label>
              <Input
                id="main-agentId"
                placeholder="e.g. abc123..."
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                ElevenLabs agent used for the Main page voice block (Conversation Bar).
              </p>
            </div>

            <div className="space-y-2">
              <Label>Connection type</Label>
              <Select
                value={connectionType}
                onValueChange={(v) => setConnectionType(v as "webrtc" | "websocket")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webrtc">WebRTC (recommended)</SelectItem>
                  <SelectItem value="websocket">WebSocket</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                WebRTC is lower latency; use WebSocket if WebRTC is blocked or unstable.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="main-defaultVoiceId">Default voice ID (optional)</Label>
              <Input
                id="main-defaultVoiceId"
                placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                value={defaultVoiceId}
                onChange={(e) => setDefaultVoiceId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional default voice for the Main voice picker.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Default audio track</Label>
              {libraryLoading ? (
                <p className="text-sm text-muted-foreground">Loading library…</p>
              ) : libraryTracks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Upload tracks to the Verse playlist to use them here.
                </p>
              ) : (
                <Select
                  value={selectedLibraryTrackId}
                  onValueChange={(id) => {
                    setSelectedLibraryTrackId(id)
                    if (id !== EMPTY_LIBRARY_ID) {
                      const track = libraryTracks.find((t) => t.id === id)
                      if (track?.public_url) setAudioSampleUrl(track.public_url)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None / use URL below" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_LIBRARY_ID}>None / use URL below</SelectItem>
                    {libraryTracks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.audio_title?.trim() || t.file_name}
                        {t.audio_artist?.trim() ? ` — ${t.audio_artist}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="main-audioSampleUrl">Brand audio sample URL</Label>
              <Input
                id="main-audioSampleUrl"
                placeholder="https://..."
                value={audioSampleUrl}
                onChange={(e) => {
                  setAudioSampleUrl(e.target.value)
                  setSelectedLibraryTrackId(EMPTY_LIBRARY_ID)
                }}
              />
              <p className="text-xs text-muted-foreground">
                URL for the &quot;Listen&quot; section on Main. Choose a library track above or paste a URL. Fallback: NEXT_PUBLIC_MAIN_LANDING_AUDIO_SAMPLE_URL.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="main-showVoiceSection">Show voice section on Main</Label>
                <p className="text-xs text-muted-foreground">
                  Show the &quot;Talk to MOOD MNKY&quot; block on the landing page.
                </p>
              </div>
              <Switch
                id="main-showVoiceSection"
                checked={showVoiceSection}
                onCheckedChange={setShowVoiceSection}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="main-showAudioSample">Show audio sample section</Label>
                <p className="text-xs text-muted-foreground">
                  Show the &quot;Listen&quot; block with the brand sample.
                </p>
              </div>
              <Switch
                id="main-showAudioSample"
                checked={showAudioSample}
                onCheckedChange={setShowAudioSample}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="main-showTranscriptViewer">Show transcript viewer in voice block</Label>
                <p className="text-xs text-muted-foreground">
                  When transcript data is available, show it in the voice block.
                </p>
              </div>
              <Switch
                id="main-showTranscriptViewer"
                checked={showTranscriptViewer}
                onCheckedChange={setShowTranscriptViewer}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="main-showWaveformInVoiceBlock">Show waveform in voice block</Label>
                <p className="text-xs text-muted-foreground">
                  Show waveform visualization next to the Orb in the voice block.
                </p>
              </div>
              <Switch
                id="main-showWaveformInVoiceBlock"
                checked={showWaveformInVoiceBlock}
                onCheckedChange={setShowWaveformInVoiceBlock}
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                {success}
              </div>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
