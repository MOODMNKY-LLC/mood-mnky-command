"use client"

import { useEffect, useState } from "react"
import { MainGlassCard } from "@/components/main/main-glass-card"
import {
  MainOrb,
  MainShimmeringText,
  MainBarVisualizer,
  MainMatrix,
  MainMessage,
  MainResponse,
  MainLiveWaveform,
  MainMicSelector,
  MainScrubBar,
  MainVoiceButton,
  MainVoicePicker,
  MainWaveform,
  MainConversationBar,
  MainConversation,
  ConversationEmptyState,
  MainSpeechInput,
  AudioPlayerProvider,
  MainAudioPlayer,
} from "@/components/main/elevenlabs"
import {
  AudioPlayerButton,
  AudioPlayerProgress,
  AudioPlayerTime,
  AudioPlayerDuration,
} from "@/components/ui/audio-player"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BlurFade } from "@/components/ui/blur-fade"
import { DottedMap } from "@/components/ui/dotted-map"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Dock, DockIcon } from "@/components/ui/dock"

const AUDIO_PLAYER_FALLBACK_URL = "https://storage.googleapis.com/eleven-public-cdn/audio/ui-elevenlabs-io/00.mp3"

const WAVEFORM_DEMO_DATA = Array.from({ length: 50 }, () => 0.2 + Math.random() * 0.6)

type AgentState = "thinking" | "listening" | "talking" | null

function OrbDemoCard() {
  const [agentState, setAgentState] = useState<AgentState>(null)
  return (
    <DemoCard
      title="Orb"
      description="Agent state visualization (Idle / Listening / Talking)"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="aspect-square h-14 w-14 shrink-0">
          <MainOrb agentState={agentState} />
        </div>
        <div className="flex flex-wrap justify-center gap-1">
          {(["idle", "listening", "talking", "thinking"] as const).map((label) => (
            <Button
              key={label}
              variant={agentState === (label === "idle" ? null : label) ? "default" : "outline"}
              size="sm"
              className="capitalize"
              onClick={() => setAgentState(label === "idle" ? null : label)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </DemoCard>
  )
}

type ElevenLabsConfig = {
  agentId: string | null
  audioSampleUrl: string | null
  connectionType: "webrtc" | "websocket"
}

function LiveWaveformDemoCard() {
  const [active, setActive] = useState(false)
  return (
    <DemoCard
      title="Live Waveform"
      description="Waveform display (toggle to simulate active)"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-full min-w-[200px] max-w-[280px]">
          <MainLiveWaveform active={active} height={48} className="w-full" />
        </div>
        <Button size="sm" variant={active ? "default" : "outline"} onClick={() => setActive((a) => !a)}>
          {active ? "Active" : "Idle"}
        </Button>
      </div>
    </DemoCard>
  )
}

type VoiceButtonState = "idle" | "listening" | "talking"
function VoiceButtonDemoCard() {
  const [state, setState] = useState<VoiceButtonState>("idle")
  const cycle = () =>
    setState((s) => (s === "idle" ? "listening" : s === "listening" ? "talking" : "idle"))
  return (
    <DemoCard title="Voice Button" description="Voice trigger (click to cycle state)">
      <MainVoiceButton state={state} onPress={cycle} trailing="Voice" />
    </DemoCard>
  )
}

function ScrubBarDemoCard() {
  const [value, setValue] = useState(0)
  return (
    <DemoCard title="Scrub Bar" description="Drag to scrub (interactive)">
      <MainScrubBar
        duration={100}
        value={value}
        onScrub={setValue}
        className="w-full"
      />
    </DemoCard>
  )
}

function DemoCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <MainGlassCard className="main-float main-glass-panel-card flex flex-col gap-3 p-4">
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="min-h-[60px] flex items-center justify-center rounded-lg border border-border/50 bg-background/30 p-4">
        {children}
      </div>
    </MainGlassCard>
  )
}

const DESIGN_TOKEN_CATEGORIES = [
  { value: "all", label: "All tokens" },
  { value: "elevenlabs", label: "ElevenLabs UI" },
  { value: "shadcn", label: "shadcn" },
  { value: "magic", label: "Magic UI" },
] as const

export function ComponentLibraryContent() {
  const [config, setConfig] = useState<ElevenLabsConfig | null>(null)
  const [category, setCategory] = useState<string>("all")

  useEffect(() => {
    fetch("/api/main/elevenlabs-config", { cache: "no-store" })
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  const showSection = (sectionId: string) =>
    category === "all" || category === sectionId

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground">Filter:</span>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All tokens" />
          </SelectTrigger>
          <SelectContent>
            {DESIGN_TOKEN_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Accordion type="multiple" className="space-y-2" defaultValue={["elevenlabs", "shadcn", "magic"]}>
        {/* ElevenLabs UI */}
        {showSection("elevenlabs") && (
          <AccordionItem value="elevenlabs" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline [&[data-state=open]]:border-b border-border pb-2">
              ElevenLabs UI
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <OrbDemoCard />
          <DemoCard title="Shimmering Text" description="Animated text">
            <MainShimmeringText text="Shimmering…" duration={2} once />
          </DemoCard>
          <DemoCard title="Bar Visualizer" description="Audio bars">
            <MainBarVisualizer barCount={12} className="h-12 w-32" />
          </DemoCard>
          <DemoCard title="Matrix" description="Matrix-style background">
            <div className="h-20 w-32 overflow-hidden rounded">
              <MainMatrix className="size-full" />
            </div>
          </DemoCard>
          <DemoCard title="Message" description="Chat message bubble">
            <MainMessage
              role="assistant"
              content="Hello from the component library."
            />
          </DemoCard>
          <DemoCard title="Response" description="Agent response block">
            <MainResponse content="Sample response text." />
          </DemoCard>
          <LiveWaveformDemoCard />
          <DemoCard title="Mic Selector" description="Microphone picker">
            <MainMicSelector />
          </DemoCard>
          <DemoCard title="Scrub Bar" description="Audio scrubber (duration, value, onScrub)">
            <MainScrubBar
              duration={100}
              value={0}
              onScrub={() => {}}
              className="w-full"
            />
          </DemoCard>
          <DemoCard title="Transcript Viewer" description="Requires alignment + audio (see voice block)">
            <p className="text-xs text-muted-foreground">Used in voice block with alignment data.</p>
          </DemoCard>
          <DemoCard title="Voice Button" description="Voice trigger">
            <MainVoiceButton
              state="idle"
              onPress={() => {}}
              trailing="Voice"
            />
          </DemoCard>
          <DemoCard title="Voice Picker" description="Voice selection">
            <MainVoicePicker
              selectedVoiceId={null}
              onSelect={() => {}}
              voices={[]}
            />
          </DemoCard>
          <DemoCard title="Waveform" description="Waveform display">
            <div className="h-20 w-full min-w-[240px] max-w-[320px]">
              <MainWaveform
                data={WAVEFORM_DEMO_DATA}
                height={80}
                barWidth={4}
                barGap={2}
                className="h-full w-full"
              />
            </div>
          </DemoCard>
          <DemoCard
            title="Conversation Bar"
            description={config?.agentId ? "Voice conversation (wired to agent)" : "Configure Main ElevenLabs agent in LABZ to see this."}
          >
            {config?.agentId ? (
              <div className="w-full max-w-sm">
                <MainConversationBar
                  agentId={config.agentId}
                  connectionType={config.connectionType}
                  onMessage={() => {}}
                  onDisconnect={() => {}}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Set agent in LABZ → Chat → Main ElevenLabs.</p>
            )}
          </DemoCard>
          <DemoCard title="Conversation" description="Chat container">
            <div className="w-full max-w-sm rounded border border-border p-2">
              <MainConversation>
                <ConversationEmptyState title="Empty" description="No messages yet." />
              </MainConversation>
            </div>
          </DemoCard>
          <DemoCard title="Speech Input" description="Speech input field">
            <MainSpeechInput onResult={() => {}} className="w-full" />
          </DemoCard>
          <DemoCard title="Audio Player" description="Requires provider">
            <AudioPlayerProvider>
              <MainAudioPlayer className="w-full max-w-xs">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <AudioPlayerButton
                      item={{
                        id: "demo",
                        src: config?.audioSampleUrl?.trim() || AUDIO_PLAYER_FALLBACK_URL,
                      }}
                    />
                    <AudioPlayerTime className="text-sm text-muted-foreground" />
                    <span className="text-muted-foreground">/</span>
                    <AudioPlayerDuration className="text-sm text-muted-foreground" />
                  </div>
                  <AudioPlayerProgress className="w-full" />
                </div>
              </MainAudioPlayer>
            </AudioPlayerProvider>
          </DemoCard>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* shadcn */}
        {showSection("shadcn") && (
          <AccordionItem value="shadcn" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline [&[data-state=open]]:border-b border-border pb-2">
              shadcn
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DemoCard title="Button" description="Variants">
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Default</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="outline" size="sm">Outline</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
            </div>
          </DemoCard>
          <DemoCard title="Input" description="Text input">
            <Input placeholder="Placeholder" className="max-w-[200px]" />
          </DemoCard>
          <DemoCard title="Card" description="Card layout">
            <Card className="w-full max-w-[240px]">
              <CardHeader className="pb-2 text-sm font-medium">Card</CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Card content here.
              </CardContent>
            </Card>
          </DemoCard>
          <DemoCard title="Tabs" description="Tab list">
            <Tabs defaultValue="a" className="w-full max-w-[200px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="a">Tab A</TabsTrigger>
                <TabsTrigger value="b">Tab B</TabsTrigger>
              </TabsList>
              <TabsContent value="a">Content A</TabsContent>
              <TabsContent value="b">Content B</TabsContent>
            </Tabs>
          </DemoCard>
          <DemoCard title="Accordion" description="Collapsible">
            <Accordion type="single" collapsible className="w-full max-w-[260px]">
              <AccordionItem value="1">
                <AccordionTrigger>Item 1</AccordionTrigger>
                <AccordionContent>Content 1</AccordionContent>
              </AccordionItem>
              <AccordionItem value="2">
                <AccordionTrigger>Item 2</AccordionTrigger>
                <AccordionContent>Content 2</AccordionContent>
              </AccordionItem>
            </Accordion>
          </DemoCard>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Magic UI */}
        {showSection("magic") && (
          <AccordionItem value="magic" className="border border-border rounded-lg px-4">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline [&[data-state=open]]:border-b border-border pb-2">
              Magic UI
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DemoCard title="Blur Fade" description="Scroll-triggered fade">
            <BlurFade delay={0.1} inView>
              <span className="text-sm">BlurFade content</span>
            </BlurFade>
          </DemoCard>
          <DemoCard title="Dotted Map" description="SVG dotted map">
            <div className="h-16 w-24 text-foreground opacity-80">
              <DottedMap
                width={96}
                height={48}
                mapSamples={800}
                dotRadius={0.2}
                dotColor="currentColor"
                className="size-full"
              />
            </div>
          </DemoCard>
          <DemoCard title="Theme Toggler" description="Light/dark toggle">
            <AnimatedThemeToggler aria-label="Toggle theme" />
          </DemoCard>
          <DemoCard title="Dock" description="Icon dock">
            <Dock iconSize={36} disableMagnification>
              <DockIcon>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                  A
                </div>
              </DockIcon>
              <DockIcon>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                  B
                </div>
              </DockIcon>
            </Dock>
          </DemoCard>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  )
}
