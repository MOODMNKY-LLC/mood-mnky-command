import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { AgentHero } from "@/components/agent-hero"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Code2, Terminal, GitBranch } from "lucide-react"

const features = [
  {
    icon: Code2,
    title: "Snippets",
    description: "Accurate, context-aware completions and snippets to speed up development.",
    tooltip: "Snippets: context-aware completions and code snippets.",
    hoverContent: "This portal supports DevOps and ecosystem tooling; snippets and completions are part of the CODE MNKY coding companion experience.",
  },
  {
    icon: Terminal,
    title: "DevOps",
    description: "Best practices for infrastructure, tooling, and deployment.",
    tooltip: "DevOps: infrastructure, tooling, and deployment guidance.",
    hoverContent: "GitHub, Vercel, Supabase, n8n, and Flowise integrations are managed from here—the backend portal for technical stack and automation.",
  },
  {
    icon: GitBranch,
    title: "Step-by-step",
    description: "Visual code snippets and clear steps for technical problem-solving.",
    tooltip: "Step-by-step: clear technical steps and visual snippets.",
    hoverContent: "Step-by-step guidance and code examples help you implement features and fix issues with full context of the monorepo and ecosystem.",
  },
]

const integrations = [
  { name: "Supabase", use: "DB, auth, storage; shared across apps." },
  { name: "GitHub", use: "Deploy, PRs, code review; repo access." },
  { name: "Vercel", use: "Deployment and edge; app hosting." },
  { name: "n8n", use: "Workflows; orchestrate agent flows." },
] as const

export default function CodeMnkyLanding() {
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
