"use client"

import { useEffect, useState, useCallback } from "react"
import { Copy, Check } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { BlurFade } from "@/components/ui/blur-fade"
import { DottedMap } from "@/components/ui/dotted-map"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { Dock, DockIcon } from "@/components/ui/dock"
import { cn } from "@/lib/utils"

type ElevenLabsConfig = {
  agentId: string | null
  audioSampleUrl: string | null
  connectionType: "webrtc" | "websocket"
}

function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = useCallback(() => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [code])
  return (
    <div className={cn("relative rounded-lg border border-border bg-muted/30", className)}>
      <pre className="overflow-x-auto p-4 text-left text-xs font-mono text-foreground">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7"
        onClick={copy}
        aria-label="Copy code"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
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

function DemoCardWithCode({
  title,
  description,
  code,
  children,
}: {
  title: string
  description?: string
  code: string
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
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 main-glass-panel">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-3">
          <div className="min-h-[60px] flex items-center justify-center rounded-lg border border-border/50 bg-background/30 p-4">
            {children}
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-3">
          <CodeBlock code={code} className="min-h-[80px]" />
        </TabsContent>
      </Tabs>
    </MainGlassCard>
  )
}

export function ComponentLibraryContent() {
  const [config, setConfig] = useState<ElevenLabsConfig | null>(null)

  useEffect(() => {
    fetch("/api/main/elevenlabs-config")
      .then((res) => res.json())
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [])

  return (
    <div className="space-y-16">
      {/* ElevenLabs UI */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2">
          ElevenLabs UI
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DemoCardWithCode
            title="Orb"
            description="Agent state visualization"
            code={`<MainOrb agentState={null} />`}
          >
            <div className="h-24 w-24">
              <MainOrb agentState={null} />
            </div>
          </DemoCardWithCode>
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
          <DemoCard title="Live Waveform" description="Waveform display">
            <MainLiveWaveform active={false} height={40} className="w-full" />
          </DemoCard>
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
            <MainWaveform className="h-12 w-40" />
          </DemoCard>
          {config?.agentId && (
            <DemoCard
              title="Conversation Bar"
              description="Voice conversation (wired to agent)"
            >
              <div className="w-full max-w-sm">
                <MainConversationBar
                  agentId={config.agentId}
                  connectionType={config.connectionType}
                  onMessage={() => {}}
                  onDisconnect={() => {}}
                />
              </div>
            </DemoCard>
          )}
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
              <MainAudioPlayer
                src={config?.audioSampleUrl ?? ""}
                className="w-full max-w-xs"
              />
            </AudioPlayerProvider>
          </DemoCard>
        </div>
      </section>

      {/* shadcn */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2">
          shadcn
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DemoCardWithCode
            title="Button"
            description="Variants"
            code={`<Button size="sm">Default</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<Button variant="outline" size="sm">Outline</Button>
<Button variant="ghost" size="sm">Ghost</Button>`}
          >
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Default</Button>
              <Button variant="secondary" size="sm">Secondary</Button>
              <Button variant="outline" size="sm">Outline</Button>
              <Button variant="ghost" size="sm">Ghost</Button>
            </div>
          </DemoCardWithCode>
          <DemoCardWithCode
            title="Input"
            description="Text input"
            code={`<Input placeholder="Placeholder" className="max-w-[200px]" />`}
          >
            <Input placeholder="Placeholder" className="max-w-[200px]" />
          </DemoCardWithCode>
          <DemoCardWithCode
            title="Card"
            description="Card layout"
            code={`<Card className="w-full max-w-[240px]">
  <CardHeader className="pb-2 text-sm font-medium">Card</CardHeader>
  <CardContent className="text-xs text-muted-foreground">
    Card content here.
  </CardContent>
</Card>`}
          >
            <Card className="w-full max-w-[240px]">
              <CardHeader className="pb-2 text-sm font-medium">Card</CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Card content here.
              </CardContent>
            </Card>
          </DemoCardWithCode>
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
      </section>

      {/* Magic UI */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground border-b border-border pb-2">
          Magic UI
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DemoCardWithCode
            title="Blur Fade"
            description="Scroll-triggered fade"
            code={`<BlurFade delay={0.1} inView>
  <span className="text-sm">BlurFade content</span>
</BlurFade>`}
          >
            <BlurFade delay={0.1} inView>
              <span className="text-sm">BlurFade content</span>
            </BlurFade>
          </DemoCardWithCode>
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
      </section>
    </div>
  )
}
