"use client"

import { useCallback, useEffect, useState } from "react"
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
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"

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

export function MainTalkToAgentDialog() {
  const { open, setOpen } = useMainTalkToAgent() ?? { open: false, setOpen: () => {} }
  const [config, setConfig] = useState<MainElevenLabsConfigGet | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [transcriptLines, setTranscriptLines] = useState<
    Array<{ source: "user" | "ai"; message: string }>
  >([])

  const fetchConfig = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    fetch("/api/main/elevenlabs-config", { cache: "no-store" })
      .then((res) => res.json().then((data: unknown) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) {
          const msg = (data as { error?: string })?.error ?? "Failed to load voice config"
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
      .catch(() => {
        setConfig(null)
        setLoadError("Couldn't load voice config. Try again.")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!open) return
    fetchConfig()
  }, [open, fetchConfig])

  const onMessage = useCallback(
    (message: { source: "user" | "ai"; message: string }) => {
      setTranscriptLines((prev) => [...prev, message])
    },
    []
  )
  const onDisconnect = useCallback(() => setTranscriptLines([]), [])

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
            Voice is not available. Enable it in LABZ → Chat → Main ElevenLabs.
          </p>
        ) : (
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
            <div className="w-full max-w-[300px]">
              {hasAgent ? (
                <MainConversationBar
                  agentId={config!.agentId!}
                  connectionType={config!.connectionType}
                  idleLabel="Voice"
                  className="p-2"
                  onMessage={onMessage}
                  onDisconnect={onDisconnect}
                />
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Voice is not configured yet. Set the Main agent in LABZ → Chat
                  → Main ElevenLabs.
                </p>
              )}
            </div>

            {/* Mic: small icon button centered */}
            <div className="flex justify-center">
              <MainMicSelector triggerVariant="icon" />
            </div>

            {/* Transcript centered */}
            {config?.showTranscriptViewer && (
              <div className="w-full space-y-1.5 border-t border-border pt-4">
                <p className="text-center text-xs font-medium text-muted-foreground">
                  Conversation transcript
                </p>
                <div className="main-glass-panel-soft max-h-[140px] min-h-[56px] overflow-y-auto rounded-lg p-3 text-sm">
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
                            {line.source === "user" ? "You: " : (
                              <>
                                <BrandMatrixText variant="MOOD MNKY" size={2} gap={0.5} className="mr-0.5 inline-block h-3.5 align-middle" />
                                :{" "}
                              </>
                            )}
                          </span>
                          {line.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
