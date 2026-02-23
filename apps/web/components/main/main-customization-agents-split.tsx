"use client"

import { useState } from "react"
import Link from "next/link"
import { MessageSquare, Headphones } from "lucide-react"
import { BlurFade } from "@/components/ui/blur-fade"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MainLandingAgentItem, MainLandingFaqItem } from "@/lib/main-landing-data"
import type { MainTryMoodMnkyConfig } from "@/components/main/main-try-mood-mnky-section"
import { MainAgentCard } from "@/components/main/main-agent-card"
import { MainChatbot } from "@/components/main/main-chatbot"
import { MainListenBlock } from "@/components/main/main-listen-block"
import { AudioPlayerProvider, MainVoicePicker } from "@/components/main/elevenlabs"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { cn } from "@/lib/utils"

const FAQ_FALLBACK: MainLandingFaqItem[] = [
  { id: "1", question: "What is MOOD MNKY?", answer: "MOOD MNKY is a luxury fragrance brand focused on extreme personalization. We offer bespoke scents, the Blending Lab for creating your own blend, and AI companions that guide you through discovery and customization.", sort_order: 0 },
  { id: "2", question: "What is the Blending Lab?", answer: "The Blending Lab is our interactive space where you choose fragrance notes and ratios to create a custom scent. You can experiment with accords and receive a handcrafted bottle that's uniquely yours.", sort_order: 1 },
  { id: "3", question: "How do I customize my scent?", answer: "Visit the Blending Lab (or blending guide) to explore our note library, adjust ratios, and save your profile. You can also work with MOOD MNKY—our AI companion—for recommendations before you blend.", sort_order: 2 },
  { id: "4", question: "Do you ship internationally?", answer: "We currently ship to select regions. Check the footer or contact page for the latest shipping options and delivery times. Custom blends may have slightly longer lead times.", sort_order: 3 },
  { id: "5", question: "What is the VERSE?", answer: "The VERSE is our storefront and community space: shop ready-to-wear scents, explore the Blending Lab, and connect with MOOD MNKY and other AI companions for a full sensory journey.", sort_order: 4 },
]

function roleFromDisplayName(displayName: string): string {
  const first = displayName.split(" ")[0]
  return first ?? displayName
}

export interface MainCustomizationAgentsSplitProps {
  agents: MainLandingAgentItem[]
  config: MainTryMoodMnkyConfig
  faqItems?: MainLandingFaqItem[] | null
  className?: string
}

/**
 * Split section: left = Frequently asked questions; right = "Meet the Agents" in a frosted glass panel.
 * Consolidated connect UI: primary Talk CTA + VoicePicker + compact Chat/Listen links.
 */
export function MainCustomizationAgentsSplit({
  agents,
  config,
  faqItems,
  className,
}: MainCustomizationAgentsSplitProps) {
  const talk = useMainTalkToAgent()
  const [chatOpen, setChatOpen] = useState(false)
  const [listenOpen, setListenOpen] = useState(false)

  const hasVoice = config.showVoiceSection && talk
  const hasListen = config.showAudioSample && config.audioSampleUrl
  const faq = (faqItems != null && faqItems.length > 0 ? faqItems : FAQ_FALLBACK)

  return (
    <BlurFade delay={0.12} inView inViewMargin="-20px" className={cn("col-span-full", className)}>
      <section
        className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12"
        style={{ marginTop: "var(--main-section-gap)" }}
      >
        {/* Left: Frequently asked questions */}
        <div className="flex flex-col justify-center">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="border-b border-border">
            {faq.map(({ id, question, answer }) => (
              <AccordionItem key={id} value={id} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:no-underline hover:text-muted-foreground">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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

            <div className="relative w-full">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  containScroll: "trimSnaps",
                  dragFree: false,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4 flex flex-nowrap">
                  {agents.map((agent) => (
                    <CarouselItem
                      key={agent.slug}
                      className="basis-[200px] pl-4 sm:basis-[200px]"
                    >
                      <MainAgentCard
                        slug={agent.slug}
                        displayName={agent.displayName}
                        role={roleFromDisplayName(agent.displayName)}
                        description={agent.blurb ?? ""}
                        imagePath={agent.imagePath}
                        model={agent.model}
                        tools={agent.tools}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {agents.length > 1 && (
                  <>
                    <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 border-border bg-background/80 backdrop-blur-sm hover:bg-background" />
                    <CarouselNext className="right-0 top-1/2 -translate-y-1/2 border-border bg-background/80 backdrop-blur-sm hover:bg-background" />
                  </>
                )}
              </Carousel>
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
