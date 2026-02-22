"use client"

import { MainGlassCard } from "@/components/main/main-glass-card"
import { MainOrb, MainMicSelector, MainConversationBar } from "@/components/main/elevenlabs"
import type { MainElevenLabsConfig } from "@/lib/main-landing-data"

export interface MainVoiceBlockProps {
  config: MainElevenLabsConfig
}

export function MainVoiceBlock({ config }: MainVoiceBlockProps) {
  if (!config.showVoiceSection) return null

  const hasAgent = Boolean(config.agentId?.trim())

  return (
    <section className="space-y-6">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-32 w-32 md:h-40 md:w-40">
            <MainOrb agentState={null} />
          </div>
          <MainMicSelector />
        </div>
        <MainGlassCard className="flex w-full max-w-md flex-col gap-4">
          <h3 className="text-lg font-semibold text-foreground">Talk to MOOD MNKY</h3>
          {hasAgent ? (
            <MainConversationBar agentId={config.agentId!} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Voice is not configured yet. Set the Main agent in LABZ → Chat → Main ElevenLabs.
            </p>
          )}
        </MainGlassCard>
      </div>
    </section>
  )
}
