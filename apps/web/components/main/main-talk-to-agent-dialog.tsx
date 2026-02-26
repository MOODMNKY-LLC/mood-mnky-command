"use client"

import { Component, useCallback, useEffect, useRef, useState } from "react"
import type { ErrorInfo, ReactNode } from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  MainMicSelector,
  MainConversationBar,
  MainLiveWaveform,
} from "@/components/main/elevenlabs"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS, MAIN_MASCOT_FALLBACK_HERO } from "@/lib/main-mascot-assets"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"

type MainElevenLabsConfigGet = {
  agentId: string | null
  showVoiceSection: boolean
  connectionType: "webrtc" | "websocket"
  showTranscriptViewer: boolean
  showWaveformInVoiceBlock: boolean
}

function isConfigShape(data: unknown): data is MainElevenLabsConfigGet {
  return (
    data !== null &&
    typeof data === "object" &&
    typeof (data as Record<string, unknown>).showVoiceSection === "boolean"
  )
}

/** Catches client errors in voice UI (e.g. ElevenLabs SDK, media APIs on mobile) so the app doesn't crash. */
class MainTalkToAgentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[MainTalkToAgentErrorBoundary]", error.message, error.stack, errorInfo.componentStack)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <p className="text-sm text-muted-foreground">
            Voice chat isn&apos;t available on this device or browser. Try on desktop or check microphone permissions.
          </p>
          <p className="text-xs text-muted-foreground">
            You can still{" "}
            <Link href="/dojo/chat" className="underline hover:text-foreground">
              chat with MOOD MNKY in the Dojo
            </Link>
            .
          </p>
        </div>
      )
    }
    return this.props.children
  }
}

export function MainTalkToAgentDialog() {
  const { open, setOpen } = useMainTalkToAgent() ?? { open: false, setOpen: () => {} }
  const [config, setConfig] = useState<MainElevenLabsConfigGet | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const [transcriptLines, setTranscriptLines] = useState<
    Array<{ source: "user" | "ai"; message: string }>
  >([])

  const getConfigUrl = useCallback(() => {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/api/main/elevenlabs-config`
    }
    return "/api/main/elevenlabs-config"
  }, [])

  const fetchConfig = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    const url = getConfigUrl()
    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        const data: unknown = await res.json().catch(() => ({}))
        return { ok: res.ok, status: res.status, data }
      })
      .then(({ ok, status, data }) => {
        if (!ok) {
          const msg =
            (data as { error?: string })?.error ??
            (status === 500
              ? "Server error loading voice config. Check production logs."
              : status === 503
                ? "Voice config temporarily unavailable."
                : "Failed to load voice config.")
          setConfig(null)
          setLoadError(msg)
          return
        }
        if (isConfigShape(data)) {
          setConfig(data)
          setLoadError(null)
        } else {
          setConfig(null)
          setLoadError("Couldn't load voice config. Try again.")
        }
      })
      .catch((err) => {
        setConfig(null)
        const isNetwork =
          err?.name === "TypeError" ||
          err?.message?.toLowerCase?.().includes("fetch")
        setLoadError(
          isNetwork
            ? "Couldn't reach the server. Check your connection and try again."
            : "Couldn't load voice config. Try again."
        )
      })
      .finally(() => setLoading(false))
  }, [getConfigUrl])

  useEffect(() => {
    if (!open) return
    fetchConfig()
  }, [open, fetchConfig])

  const onMessage = useCallback(
    (message: { source: "user" | "ai"; message: string }) => {
      setVoiceError(null)
      setTranscriptLines((prev) => [...prev, message])
    },
    []
  )
  const onDisconnect = useCallback(() => {
    setTranscriptLines([])
    setVoiceError(null)
  }, [])
  const onVoiceError = useCallback((err: Error) => {
    const msg = err?.message ?? "Voice connection failed."
    const isMic =
      /microphone|permission|not allowed|denied/i.test(msg) || err?.name === "NotAllowedError"
    setVoiceError(
      isMic
        ? "Microphone access is needed. Tap Allow when prompted, or enable in Settings → Safari → Microphone (iPhone/iPad)."
        : msg
    )
  }, [])
  const transcriptEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcriptLines])

  const hasAgent = Boolean(config?.agentId?.trim())
  const showVoice = config?.showVoiceSection !== false

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="main-glass-panel-card max-h-[90vh] max-w-lg overflow-y-auto border border-border bg-background/95 p-6 backdrop-blur-md">
        <DialogHeader className="space-y-1 text-center">
          <DialogTitle>Talk to MOOD MNKY</DialogTitle>
          <p className="text-sm font-normal text-muted-foreground">
            Have a voice conversation with MOOD MNKY.
          </p>
        </DialogHeader>
        {loading ? (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" size="sm" onClick={fetchConfig}>
              Try again
            </Button>
          </div>
        ) : !showVoice ? (
          <p className="text-center text-sm text-muted-foreground">
            Voice is not available. Enable it in LABZ → Chat → ElevenLabs → Main.
          </p>
        ) : (
          <MainTalkToAgentErrorBoundary>
            <div className="flex flex-col items-center gap-4">
              {/* Avatar centered */}
              <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-border sm:h-32 sm:w-32">
                <MainMascotImage
                src={MAIN_MASCOT_FALLBACK_HERO}
                fallbackSrc={MAIN_MASCOT_ASSETS.hero}
                alt="MOOD MNKY – Voice"
                fill
                className="object-contain object-center"
                hideOnError
              />
            </div>

            {/* Optional waveform centered under avatar */}
            {config?.showWaveformInVoiceBlock && (
              <div className="w-full max-w-[160px]">
                <MainLiveWaveform
                  active={false}
                  height={32}
                  className="main-glass-panel rounded-lg"
                />
              </div>
            )}

            {/* Command bar centered beneath avatar */}
            {voiceError && (
              <p className="text-center text-sm text-destructive">{voiceError}</p>
            )}
            <div className="w-full max-w-[300px]">
              {hasAgent ? (
                <MainConversationBar
                  agentId={config!.agentId!}
                  connectionType={config!.connectionType}
                  idleLabel="Voice"
                  className="p-2"
                  onMessage={onMessage}
                  onDisconnect={onDisconnect}
                  onError={onVoiceError}
                />
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Voice is not configured yet. Set the Main agent in{" "}
                  <Link href="/chat/eleven-labs/main" className="underline hover:text-foreground">
                    LABZ → Chat → ElevenLabs → Main
                  </Link>
                  .
                </p>
              )}
            </div>

            {/* Mic: small icon button centered */}
            <div className="flex justify-center">
              <MainMicSelector triggerVariant="icon" />
            </div>

            {/* Transcript: fixed height, scrolls like a normal chat */}
            {config?.showTranscriptViewer && (
              <div className="w-full space-y-1.5 border-t border-border pt-4">
                <p className="text-center text-xs font-medium text-muted-foreground">
                  Conversation transcript
                </p>
                <div className="main-glass-panel-soft h-[160px] overflow-y-auto rounded-lg p-3 text-sm">
                  {transcriptLines.length === 0 ? (
                    <p className="text-center text-muted-foreground text-xs">
                      Start a call to see the transcript here.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {transcriptLines.map((line, i) => (
                        <li
                          key={i}
                          className={
                            line.source === "user"
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          <span className="font-medium">
                            {line.source === "user" ? "You: " : "MOOD MNKY: "}
                          </span>
                          {line.message}
                        </li>
                      ))}
                      <li ref={transcriptEndRef} aria-hidden />
                    </ul>
                  )}
                </div>
              </div>
            )}
            </div>
          </MainTalkToAgentErrorBoundary>
        )}
      </DialogContent>
    </Dialog>
  )
}
