"use client"

import { useState, useCallback } from "react"
import { MainGlassCard } from "@/components/main/main-glass-card"
import {
  MainMicSelector,
  MainConversationBar,
  MainLiveWaveform,
} from "@/components/main/elevenlabs"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"
import type { MainElevenLabsConfig } from "@/lib/main-landing-data"

export interface MainVoiceBlockProps {
  config: MainElevenLabsConfig
}

export function MainVoiceBlock({ config }: MainVoiceBlockProps) {
  const [transcriptLines, setTranscriptLines] = useState<
    Array<{ source: "user" | "ai"; message: string }>
  >([])

  const onMessage = useCallback(
    (message: { source: "user" | "ai"; message: string }) => {
      setTranscriptLines((prev) => [...prev, message])
    },
    []
  )

  const onDisconnect = useCallback(() => {
    setTranscriptLines([])
  }, [])

  if (!config.showVoiceSection) return null

  const hasAgent = Boolean(config.agentId?.trim())

  return (
    <section className="main-glass-section space-y-6 rounded-xl p-6">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32 overflow-hidden rounded-xl border border-border md:h-40 md:w-40">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.voice}
              alt="MOOD MNKY – Voice"
              fill
              className="object-cover object-center"
              hideOnError
            />
          </div>
          {config.showWaveformInVoiceBlock && (
            <div className="w-full max-w-[200px]">
              <MainLiveWaveform
                active={false}
                height={48}
                className="main-glass-panel rounded-lg"
              />
            </div>
          )}
          <MainMicSelector />
        </div>
        <MainGlassCard className="main-float main-glass-panel-card flex w-full max-w-md flex-col gap-4">
          <h3 className="text-lg font-semibold text-foreground">Talk to MOOD MNKY</h3>
          {hasAgent ? (
            <MainConversationBar
              agentId={config.agentId!}
              connectionType={config.connectionType}
              onMessage={onMessage}
              onDisconnect={onDisconnect}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Voice is not configured yet. Set the Main agent in LABZ → Chat → Main ElevenLabs.
            </p>
          )}
          {config.showTranscriptViewer && (
            <div className="mt-2 border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Transcript</p>
              <div className="main-glass-panel-soft min-h-[80px] max-h-[200px] overflow-y-auto rounded-lg p-3 text-sm text-muted-foreground">
                {transcriptLines.length === 0 ? (
                  <p className="text-xs">
                    Transcript will appear here when you&apos;re in a voice conversation.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {transcriptLines.map((line, i) => (
                      <li
                        key={i}
                        className={line.source === "user" ? "text-foreground" : "text-muted-foreground"}
                      >
                        <span className="font-medium">{line.source === "user" ? "You: " : "MOOD MNKY: "}</span>
                        {line.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </MainGlassCard>
      </div>
    </section>
  )
}
