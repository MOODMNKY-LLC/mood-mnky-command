"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

export function MainTalkToAgentDialog() {
  const { open, setOpen } = useMainTalkToAgent() ?? { open: false, setOpen: () => {} }
  const [config, setConfig] = useState<MainElevenLabsConfigGet | null>(null)
  const [loading, setLoading] = useState(true)
  const [transcriptLines, setTranscriptLines] = useState<
    Array<{ source: "user" | "ai"; message: string }>
  >([])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    fetch("/api/main/elevenlabs-config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: MainElevenLabsConfigGet) => {
        if (!cancelled) setConfig(data)
      })
      .catch(() => {
        if (!cancelled) setConfig(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

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
      <DialogContent className="main-glass-panel-card max-h-[90vh] max-w-lg overflow-y-auto border border-border bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-left">Talk to MOOD MNKY</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !showVoice ? (
          <p className="text-sm text-muted-foreground">
            Voice is not available. Enable it in LABZ → Chat → Main ElevenLabs.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border sm:h-32 sm:w-32">
                  <MainMascotImage
                    src={MAIN_MASCOT_FALLBACK_HERO}
                    fallbackSrc={MAIN_MASCOT_ASSETS.hero}
                    alt="MOOD MNKY – Voice"
                    fill
                    className="object-contain object-center"
                    hideOnError
                  />
                </div>
                {config?.showWaveformInVoiceBlock && (
                  <div className="w-full max-w-[180px]">
                    <MainLiveWaveform
                      active={false}
                      height={40}
                      className="main-glass-panel rounded-lg"
                    />
                  </div>
                )}
                <MainMicSelector />
              </div>
              <div className="min-w-0 flex-1">
                {hasAgent ? (
                  <MainConversationBar
                    agentId={config!.agentId!}
                    connectionType={config!.connectionType}
                    onMessage={onMessage}
                    onDisconnect={onDisconnect}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Voice is not configured yet. Set the Main agent in LABZ →
                    Chat → Main ElevenLabs.
                  </p>
                )}
              </div>
            </div>
            {config?.showTranscriptViewer && (
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Transcript
                </p>
                <div className="main-glass-panel-soft max-h-[160px] min-h-[60px] overflow-y-auto rounded-lg p-3 text-sm text-muted-foreground">
                  {transcriptLines.length === 0 ? (
                    <p className="text-xs">
                      Transcript will appear here when you&apos;re in a voice
                      conversation.
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
