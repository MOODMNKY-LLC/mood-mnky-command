"use client"

import { useState, useCallback, useRef } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import {
  Mic,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Upload,
  FileAudio,
  Volume2,
  Languages,
  UserPlus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MediaAsset } from "@/lib/supabase/storage"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TTS_VOICES = [
  { value: "alloy", label: "Alloy" },
  { value: "ash", label: "Ash" },
  { value: "ballad", label: "Ballad" },
  { value: "coral", label: "Coral" },
  { value: "echo", label: "Echo" },
  { value: "fable", label: "Fable" },
  { value: "nova", label: "Nova" },
  { value: "onyx", label: "Onyx" },
  { value: "sage", label: "Sage" },
  { value: "shimmer", label: "Shimmer" },
  { value: "verse", label: "Verse" },
  { value: "marin", label: "Marin" },
  { value: "cedar", label: "Cedar" },
] as const

const TTS_FORMATS = [
  { value: "mp3", label: "MP3" },
  { value: "opus", label: "Opus" },
  { value: "aac", label: "AAC" },
  { value: "flac", label: "FLAC" },
  { value: "wav", label: "WAV" },
] as const

const TTS_MODELS = [
  { value: "gpt-4o-mini-tts", label: "GPT-4o Mini TTS (recommended)" },
  { value: "tts-1", label: "TTS-1 (fast)" },
  { value: "tts-1-hd", label: "TTS-1 HD (quality)" },
] as const

const STT_MODELS = [
  { value: "gpt-4o-transcribe", label: "GPT-4o Transcribe" },
  { value: "gpt-4o-mini-transcribe", label: "GPT-4o Mini Transcribe" },
  { value: "gpt-4o-transcribe-diarize", label: "GPT-4o Transcribe (Diarization)" },
] as const

const MAX_INPUT_CHARS = 12000

function AudioStudioContent() {
  const [activeTab, setActiveTab] = useState("tts")
  const [ttsInput, setTtsInput] = useState("")
  const [ttsVoice, setTtsVoice] = useState("coral")
  const [ttsFormat, setTtsFormat] = useState("mp3")
  const [ttsModel, setTtsModel] = useState("gpt-4o-mini-tts")
  const [ttsSpeed, setTtsSpeed] = useState(1)
  const [ttsInstructions, setTtsInstructions] = useState("")
  const [ttsGenerating, setTtsGenerating] = useState(false)
  const [ttsAsset, setTtsAsset] = useState<MediaAsset | null>(null)
  const [ttsError, setTtsError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const [sttFile, setSttFile] = useState<File | null>(null)
  const [sttModel, setSttModel] = useState("gpt-4o-transcribe")
  const [sttTask, setSttTask] = useState<"transcribe" | "translate">("transcribe")
  const [sttLoading, setSttLoading] = useState(false)
  const [sttResult, setSttResult] = useState<{ text?: string; segments?: unknown[] } | null>(null)
  const [sttError, setSttError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [consentName, setConsentName] = useState("")
  const [consentLanguage, setConsentLanguage] = useState("en-US")
  const [consentFile, setConsentFile] = useState<File | null>(null)
  const [consentLoading, setConsentLoading] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const consentInputRef = useRef<HTMLInputElement>(null)

  const [voiceName, setVoiceName] = useState("")
  const [voiceConsentId, setVoiceConsentId] = useState<string>("")
  const [voiceSampleFile, setVoiceSampleFile] = useState<File | null>(null)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const voiceSampleInputRef = useRef<HTMLInputElement>(null)

  const mediaParams = new URLSearchParams()
  mediaParams.set("bucket", "ai-audio")
  mediaParams.set("limit", "12")
  const { data: mediaData, mutate: mutateMedia } = useSWR<{ assets: MediaAsset[]; count: number }>(
    `/api/media?${mediaParams.toString()}`,
    fetcher
  )
  const recentAssets = mediaData?.assets ?? []

  const { data: consentsData, mutate: mutateConsents } = useSWR<{ consents: Array<{ id: string; openai_consent_id: string; name: string | null; language: string | null }> }>(
    "/api/audio/consents",
    fetcher
  )
  const { data: voicesData, mutate: mutateVoices } = useSWR<{ voices: Array<{ id: string; openai_voice_id: string; name: string; consent_id: string }> }>(
    "/api/audio/voices",
    fetcher
  )
  const customVoices = voicesData?.voices ?? []
  const consents = consentsData?.consents ?? []

  const handleTtsGenerate = useCallback(async () => {
    setTtsError(null)
    setTtsAsset(null)
    setTtsGenerating(true)
    try {
      const res = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: ttsInput || "Hello, this is a sample of generated speech.",
          voice: ttsVoice,
          model: ttsModel,
          response_format: ttsFormat,
          speed: ttsSpeed,
          instructions: ttsInstructions || undefined,
          saveToLibrary: true,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Generation failed")
      }
      const data = await res.json()
      setTtsAsset(data.asset)
      mutateMedia()
      globalMutate("/api/media")
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : "Generation failed")
    } finally {
      setTtsGenerating(false)
    }
  }, [ttsInput, ttsVoice, ttsFormat, ttsModel, ttsSpeed, ttsInstructions, mutateMedia])

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }, [])

  const handleSttFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setSttFile(file ?? null)
    setSttResult(null)
    setSttError(null)
  }, [])

  const handleSttSubmit = useCallback(async () => {
    if (!sttFile) return
    setSttError(null)
    setSttResult(null)
    setSttLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", sttFile)
      formData.append("model", sttModel)
      if (sttTask === "transcribe") {
        formData.append("response_format", "json")
      }

      const endpoint = sttTask === "transcribe" ? "/api/audio/transcribe" : "/api/audio/translate"
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Request failed")
      }
      const data = await res.json()
      setSttResult(
        sttTask === "transcribe"
          ? { text: data.transcript?.text, segments: data.transcript?.segments }
          : { text: data.translation?.text }
      )
    } catch (err) {
      setSttError(err instanceof Error ? err.message : "Request failed")
    } finally {
      setSttLoading(false)
    }
  }, [sttFile, sttModel, sttTask])

  const handleConsentSubmit = useCallback(async () => {
    if (!consentFile) return
    setConsentError(null)
    setConsentLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", consentName || "Unnamed")
      formData.append("language", consentLanguage)
      formData.append("recording", consentFile)
      const res = await fetch("/api/audio/consents", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to upload consent")
      }
      mutateConsents()
      setConsentFile(null)
      setConsentName("")
      if (consentInputRef.current) consentInputRef.current.value = ""
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : "Failed")
    } finally {
      setConsentLoading(false)
    }
  }, [consentFile, consentName, consentLanguage, mutateConsents])

  const handleVoiceSubmit = useCallback(async () => {
    if (!voiceSampleFile || !voiceConsentId || !voiceName.trim()) return
    setVoiceError(null)
    setVoiceLoading(true)
    try {
      const formData = new FormData()
      formData.append("name", voiceName.trim())
      formData.append("consent_id", voiceConsentId)
      formData.append("audio_sample", voiceSampleFile)
      const res = await fetch("/api/audio/voices", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create voice")
      }
      mutateVoices()
      setVoiceSampleFile(null)
      setVoiceName("")
      setVoiceConsentId("")
      if (voiceSampleInputRef.current) voiceSampleInputRef.current.value = ""
    } catch (err) {
      setVoiceError(err instanceof Error ? err.message : "Failed")
    } finally {
      setVoiceLoading(false)
    }
  }, [voiceSampleFile, voiceConsentId, voiceName, mutateVoices])

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audio Studio</h1>
        <p className="text-sm text-muted-foreground">
          Generate speech from text (TTS) or transcribe/translate audio (STT). All outputs are saved to your Media Library.
        </p>
        <p className="text-xs text-muted-foreground/80 mt-0.5">
          Powered by OpenAI Audio API · GPT-4o Mini TTS · Whisper / GPT-4o Transcribe
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="tts" className="gap-2">
            <Volume2 className="h-4 w-4" />
            Text to Speech
          </TabsTrigger>
          <TabsTrigger value="stt" className="gap-2">
            <Mic className="h-4 w-4" />
            Speech to Text
          </TabsTrigger>
          <TabsTrigger value="voicelab" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Voice Lab
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tts" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Volume2 className="h-4 w-4" />
                    Generate Speech
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Script/Text</Label>
                    <p className="text-xs text-muted-foreground">
                      Enter the text to speak. Max ~12,000 characters.
                    </p>
                    <Textarea
                      value={ttsInput}
                      onChange={(e) => setTtsInput(e.target.value.slice(0, MAX_INPUT_CHARS))}
                      placeholder="Enter text to convert to speech..."
                      rows={5}
                      className="resize-none text-sm"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {ttsInput.length} / {MAX_INPUT_CHARS}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Style instructions (optional)</Label>
                    <p className="text-xs text-muted-foreground">
                      e.g. &quot;Speak in a cheerful tone&quot; or &quot;Whisper softly&quot;
                    </p>
                    <Input
                      value={ttsInstructions}
                      onChange={(e) => setTtsInstructions(e.target.value)}
                      placeholder="Speak in a warm, professional tone."
                      className="text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-2">
                      <Label>Voice</Label>
                      <Select value={ttsVoice} onValueChange={setTtsVoice}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TTS_VOICES.map((v) => (
                            <SelectItem key={v.value} value={v.value}>
                              {v.label}
                            </SelectItem>
                          ))}
                          {customVoices.length > 0 && (
                            <>
                              <div className="mx-2 my-1 h-px bg-border" />
                              {customVoices.map((v) => (
                                <SelectItem key={v.id} value={v.openai_voice_id}>
                                  {v.name} (custom)
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Format</Label>
                      <Select value={ttsFormat} onValueChange={setTtsFormat}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TTS_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Model</Label>
                      <Select value={ttsModel} onValueChange={setTtsModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TTS_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Speed: {ttsSpeed}x</Label>
                    <input
                      type="range"
                      min="0.25"
                      max="4"
                      step="0.05"
                      value={ttsSpeed}
                      onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {ttsError && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {ttsError}
                    </div>
                  )}

                  <Button
                    onClick={handleTtsGenerate}
                    disabled={ttsGenerating}
                    className="w-fit gap-2"
                  >
                    {ttsGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Generate
                      </>
                    )}
                  </Button>

                  {ttsAsset?.public_url && (
                    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium">Generated</p>
                      <audio controls src={ttsAsset.public_url} className="w-full" />
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleCopyUrl(ttsAsset.public_url!)}
                        >
                          {copiedUrl ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedUrl ? "Copied" : "Copy URL"}
                        </Button>
                        <a
                          href={ttsAsset.public_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Open in new tab
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Recent Generations</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAssets.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No generations yet</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {recentAssets.slice(0, 6).map((asset) => (
                        <div
                          key={asset.id}
                          className="flex flex-col gap-1 rounded-lg border border-border p-2"
                        >
                          <div className="flex items-center gap-2">
                            <FileAudio className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate text-xs">{asset.file_name}</span>
                          </div>
                          {asset.public_url && (
                            <audio controls src={asset.public_url} className="h-8 w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stt" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-4 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Upload className="h-4 w-4" />
                    Upload & Transcribe / Translate
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Audio file</Label>
                    <p className="text-xs text-muted-foreground">
                      MP3, MP4, M4A, WAV, WebM. Max 25 MB.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,video/mp4"
                      onChange={handleSttFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card px-6 py-10 transition-colors hover:border-muted-foreground/40 hover:bg-accent/50"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {sttFile ? sttFile.name : "Click or drag to select file"}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {sttFile ? `${(sttFile.size / 1024).toFixed(1)} KB` : "Max 25 MB"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Task</Label>
                    <Select
                      value={sttTask}
                      onValueChange={(v) => {
                        setSttTask(v as "transcribe" | "translate")
                        setSttResult(null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transcribe">Transcribe (same language)</SelectItem>
                        <SelectItem value="translate">Translate to English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {sttTask === "transcribe" && (
                    <div className="flex flex-col gap-2">
                      <Label>Model</Label>
                      <Select value={sttModel} onValueChange={setSttModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STT_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {sttError && (
                    <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {sttError}
                    </div>
                  )}

                  <Button
                    onClick={handleSttSubmit}
                    disabled={!sttFile || sttLoading}
                    className="w-fit gap-2"
                  >
                    {sttLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : sttTask === "transcribe" ? (
                      <>
                        <Mic className="h-4 w-4" />
                        Transcribe
                      </>
                    ) : (
                      <>
                        <Languages className="h-4 w-4" />
                        Translate to English
                      </>
                    )}
                  </Button>

                  {sttResult?.text && (
                    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-4">
                      <p className="text-sm font-medium">Result</p>
                      <div className="max-h-48 overflow-y-auto rounded bg-background p-3 text-sm">
                        {sttResult.text}
                      </div>
                      {sttResult.segments && sttResult.segments.length > 0 && (
                        <div className="mt-2 flex flex-col gap-1">
                          <p className="text-xs font-medium text-muted-foreground">Segments</p>
                          {(sttResult.segments as Array<{ start?: number; end?: number; text?: string; speaker?: string }>).map((s, i) => (
                            <div key={i} className="text-xs">
                              {s.speaker && <span className="font-medium">{s.speaker}: </span>}
                              {s.text}
                              {s.start != null && (
                                <span className="ml-2 text-muted-foreground">
                                  [{s.start?.toFixed(1)}s–{s.end?.toFixed(1)}s]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voicelab" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserPlus className="h-4 w-4" />
                  Upload Consent Recording
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Record the consent phrase. The voice actor must read one of the approved phrases. See OpenAI docs for requirements.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Name / Label</Label>
                  <Input
                    value={consentName}
                    onChange={(e) => setConsentName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Language (BCP 47)</Label>
                  <Input
                    value={consentLanguage}
                    onChange={(e) => setConsentLanguage(e.target.value)}
                    placeholder="en-US"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Consent recording</Label>
                  <input
                    ref={consentInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setConsentFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div
                    onClick={() => consentInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card px-6 py-8 transition-colors hover:border-muted-foreground/40 hover:bg-accent/50"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {consentFile ? consentFile.name : "Select consent recording"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Max 10 MB · WAV, MP3, etc.</p>
                  </div>
                </div>
                {consentError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {consentError}
                  </div>
                )}
                <Button
                  onClick={handleConsentSubmit}
                  disabled={!consentFile || consentLoading}
                  className="w-fit gap-2"
                >
                  {consentLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Consent"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Volume2 className="h-4 w-4" />
                  Create Custom Voice
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Record the voice sample. Must match the consent recording. See OpenAI docs for requirements.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Consent</Label>
                  <Select value={voiceConsentId} onValueChange={setVoiceConsentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a consent" />
                    </SelectTrigger>
                    <SelectContent>
                      {consents.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name || "Unnamed"} ({c.language || "en"})
                        </SelectItem>
                      ))}
                      {consents.length === 0 && (
                        <div className="px-2 py-1 text-xs text-muted-foreground">Upload a consent first</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Voice name</Label>
                  <Input
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="My custom voice"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Audio sample</Label>
                  <input
                    ref={voiceSampleInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setVoiceSampleFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  <div
                    onClick={() => voiceSampleInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card px-6 py-8 transition-colors hover:border-muted-foreground/40 hover:bg-accent/50"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {voiceSampleFile ? voiceSampleFile.name : "Select audio sample"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Max 10 MB · WAV, MP3, etc.</p>
                  </div>
                </div>
                {voiceError && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {voiceError}
                  </div>
                )}
                <Button
                  onClick={handleVoiceSubmit}
                  disabled={!voiceSampleFile || !voiceConsentId || !voiceName.trim() || voiceLoading}
                  className="w-fit gap-2"
                >
                  {voiceLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Voice"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Consents</CardTitle>
              </CardHeader>
              <CardContent>
                {consents.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No consents yet</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {consents.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                        <span className="text-sm">{c.name || "Unnamed"}</span>
                        <span className="text-xs text-muted-foreground">{c.language || "en"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Custom Voices</CardTitle>
              </CardHeader>
              <CardContent>
                {customVoices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No custom voices yet</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {customVoices.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-lg border border-border p-2">
                        <span className="text-sm">{v.name}</span>
                        <span className="text-xs text-muted-foreground">{v.openai_voice_id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function AudioStudioPage() {
  return (
    <div className="flex min-h-[400px] flex-col">
      <AudioStudioContent />
    </div>
  )
}
