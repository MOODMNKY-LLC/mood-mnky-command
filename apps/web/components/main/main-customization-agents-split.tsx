"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, MessageSquare, Headphones } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MainLandingAgentItem } from "@/lib/main-landing-data"
import type { MainTryMoodMnkyConfig } from "@/components/main/main-try-mood-mnky-section"
import { MainAgentCard } from "@/components/main/main-agent-card"
import { MainChatbot } from "@/components/main/main-chatbot"
import { MainListenBlock } from "@/components/main/main-listen-block"
import { AudioPlayerProvider, MainVoicePicker } from "@/components/main/elevenlabs"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { cn } from "@/lib/utils"

function roleFromDisplayName(displayName: string): string {
  const first = displayName.split(" ")[0]
  return first ?? displayName
}

export interface MainCustomizationAgentsSplitProps {
  agents: MainLandingAgentItem[]
  config: MainTryMoodMnkyConfig
  className?: string
}

/**
 * Split section: left = "Your scent, your vessel"; right = "Meet the Agents" in a frosted glass panel.
 * Consolidated connect UI: primary Talk CTA + VoicePicker + compact Chat/Listen links.
 */
export function MainCustomizationAgentsSplit({
  agents,
  config,
  className,
}: MainCustomizationAgentsSplitProps) {
  const talk = useMainTalkToAgent()
  const [chatOpen, setChatOpen] = useState(false)
  const [listenOpen, setListenOpen] = useState(false)

  const hasVoice = config.showVoiceSection && talk
  const hasListen = config.showAudioSample && config.audioSampleUrl

  return (
    <BlurFade delay={0.12} inView inViewMargin="-20px" className={cn("col-span-full", className)}>
      <section
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12"
        style={{ marginTop: "var(--main-section-gap)" }}
      >
        {/* Left: Your scent, your vessel */}
        <div className="flex flex-col justify-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Your scent, your vessel
          </h2>
          <p className="mt-4 text-muted-foreground">
            We believe fragrance should reflect who you are. In the Blending Lab
            you choose notes and ratios; we also offer container personalization—so
            your bottle is as unique as your blend.
          </p>
          <ul className="mt-6 space-y-3 text-muted-foreground">
            {[
              "Custom scent profiles built from our note library",
              "Bottle and cap options to match your style",
              "Labels and packaging that feel personal, not generic",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Meet the Agents – frosted glass panel (same look as dock) */}
        <div className="main-glass-panel flex flex-col rounded-2xl border border-border p-6 md:p-8">
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Meet the Agents
              </h2>
              <p className="text-sm text-muted-foreground">
                Your AI companions—explore, learn, and connect.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {agents.map((agent) => (
                <MainAgentCard
                  key={agent.slug}
                  slug={agent.slug}
                  displayName={agent.displayName}
                  role={roleFromDisplayName(agent.displayName)}
                  description={agent.blurb ?? ""}
                  imagePath={agent.imagePath}
                  model={agent.model}
                  tools={agent.tools}
                />
              ))}
            </div>

            {/* Voice/agent switcher – ElevenLabs UI for visual break and appeal */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Voice & agent
              </p>
              <AudioPlayerProvider>
                <MainVoicePicker
                  voices={[]}
                  placeholder="MOOD MNKY (default)"
                  className="w-full max-w-xs"
                />
              </AudioPlayerProvider>
            </div>

            {/* Consolidated connect: one primary CTA + compact Chat/Listen */}
            <div className="flex flex-col gap-3 pt-2">
                {hasVoice && (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => talk?.openDialog()}
                  >
                    <VerseLogoHairIcon
                      withRing
                      size="sm"
                      className="text-current"
                      ringClassName="border-current/80"
                    />
                    Talk to MOOD MNKY
                  </Button>
                )}
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => setChatOpen(true)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </button>
                  {hasListen && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
                      onClick={() => setListenOpen(true)}
                    >
                      <Headphones className="h-4 w-4" />
                      Listen
                    </button>
                  )}
                  <Link
                    href="/verse/chat"
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Open in VERSE
                  </Link>
                </div>
              </div>
          </div>
        </div>
      </section>

      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="main-glass-panel-card max-h-[85vh] max-w-2xl overflow-y-auto border border-border bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-left">Chat with MOOD MNKY</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <MainChatbot />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={listenOpen} onOpenChange={setListenOpen}>
        <DialogContent className="main-glass-panel-card max-w-md overflow-y-auto border border-border bg-background/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="text-left">Listen</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <MainListenBlock
              audioSampleUrl={config.audioSampleUrl}
              showAudioSample={config.showAudioSample}
            />
          </div>
        </DialogContent>
      </Dialog>
    </BlurFade>
  )
}
