"use client"

import { useState } from "react"
import { MessageSquare, Mic, Headphones } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { MainChatbot } from "@/components/main/main-chatbot"
import { MainListenBlock } from "@/components/main/main-listen-block"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { cn } from "@/lib/utils"

export interface MainTryMoodMnkyConfig {
  showVoiceSection: boolean
  showAudioSample: boolean
  audioSampleUrl: string | null
}

export interface MainTryMoodMnkySectionProps {
  config: MainTryMoodMnkyConfig
  className?: string
  /** When false, heading and subline are hidden (e.g. when embedded in Meet the Agents). Default true. */
  showHeading?: boolean
}

export function MainTryMoodMnkySection({ config, className, showHeading = true }: MainTryMoodMnkySectionProps) {
  const talk = useMainTalkToAgent()
  const [chatOpen, setChatOpen] = useState(false)
  const [listenOpen, setListenOpen] = useState(false)

  const cards = [
    {
      id: "chat",
      title: "Chat with MOOD MNKY",
      description: "Ask about our brand, fragrances, or the Dojo.",
      icon: MessageSquare,
      cta: "Try chat",
      onClick: () => setChatOpen(true),
    },
    ...(config.showVoiceSection && talk
      ? [
          {
            id: "voice",
            title: "Talk to MOOD MNKY",
            description: "Start a voice conversation with our AI companion.",
            icon: Mic,
            cta: "Try voice",
            onClick: () => talk.openDialog(),
          },
        ]
      : []),
    ...(config.showAudioSample && config.audioSampleUrl
      ? [
          {
            id: "listen",
            title: "Listen",
            description: "A short sensory journey.",
            icon: Headphones,
            cta: "Play sample",
            onClick: () => setListenOpen(true),
          },
        ]
      : []),
  ]

  if (cards.length === 0) return null

  return (
    <section className={cn("space-y-6", className)}>
      {showHeading && (
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Try MOOD MNKY
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Chat, talk, or listen—choose your way to connect.
          </p>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <MainGlassCard
              key={card.id}
              role="button"
              tabIndex={0}
              className="main-float main-glass-panel-card flex cursor-pointer flex-col gap-3 p-5 transition-shadow hover:shadow-lg"
              onClick={card.onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  card.onClick()
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 text-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <button
                type="button"
                className="mt-auto w-fit text-sm font-medium text-primary hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  card.onClick()
                }}
              >
                {card.cta} →
              </button>
            </MainGlassCard>
          )
        })}
      </div>

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
    </section>
  )
}
