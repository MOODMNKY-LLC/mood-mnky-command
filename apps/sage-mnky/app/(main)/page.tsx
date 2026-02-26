import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { AgentHero } from "@/components/agent-hero"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Compass, Lightbulb, BookOpen } from "lucide-react"

const features = [
  {
    icon: Compass,
    title: "Reflect",
    description: "Step back and consider. Ask thoughtful questions that prompt deeper thinking.",
    tooltip: "Reflect: step back and consider; thoughtful questions for deeper thinking.",
    hoverContent: "Use this portal for guidance product features that support reflection—prompts, journals, and reflective exercises tied to your profile.",
  },
  {
    icon: Lightbulb,
    title: "Decide",
    description: "Navigate difficult decisions with careful consideration and multiple perspectives.",
    tooltip: "Decide: navigate decisions with careful consideration and multiple perspectives.",
    hoverContent: "Decision-support tools and frameworks live here; SAGE MNKY is the backend portal for guidance and reflection features.",
  },
  {
    icon: BookOpen,
    title: "Learn",
    description: "Connect insights to principles. Support continuous learning and development.",
    tooltip: "Learn: connect insights to principles; support continuous learning.",
    hoverContent: "Knowledge bases, Notion sync, and learning paths can be orchestrated from this app for a cohesive guidance experience.",
  },
]

const integrations = [
  { name: "Notion", use: "Knowledge base, config; docs and guidance content." },
  { name: "Supabase", use: "Profiles, sessions, reflections; shared auth." },
  { name: "OpenAI", use: "Guidance prompts, reflective chat." },
] as const

export default function SageMnkyLanding() {
  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <AgentHero />
        <section
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          style={{ marginTop: "var(--main-section-gap)" }}
        >
          {features.map(({ icon: Icon, title, description, tooltip, hoverContent }) => (
            <Card key={title} className="main-glass-panel-card main-float border-border/50">
              <CardHeader>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Icon className="size-5 text-primary" />
                          {title}
                        </CardTitle>
                      </TooltipTrigger>
                      <TooltipContent>{tooltip}</TooltipContent>
                    </Tooltip>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">{hoverContent}</HoverCardContent>
                </HoverCard>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0" />
            </Card>
          ))}
        </section>
        <section
          className="mt-12 flex flex-wrap items-center gap-3"
          style={{ marginTop: "var(--main-section-gap)" }}
        >
          <span className="text-sm text-muted-foreground">Integrations:</span>
          {integrations.map(({ name, use }) => (
            <Tooltip key={name}>
              <TooltipTrigger asChild>
                <span className="rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs font-medium text-foreground">
                  {name}
                </span>
              </TooltipTrigger>
              <TooltipContent>{use}</TooltipContent>
            </Tooltip>
          ))}
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
