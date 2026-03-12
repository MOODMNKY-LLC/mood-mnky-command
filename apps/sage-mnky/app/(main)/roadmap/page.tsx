import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MermaidDiagram } from "@/components/mermaid-diagram"

const ecosystemDiagram = `flowchart LR
  subgraph Brand
    Main[Main site]
    Dojo[Dojo]
    Verse[Verse]
  end
  subgraph Agents
    SAGE[SAGE MNKY app]
  end
  subgraph Data
    Notion[Notion]
    Supabase[Supabase]
  end
  SAGE --> Supabase
  SAGE --> Notion
  SAGE --> Main`

const appPhasesDiagram = `flowchart TB
  subgraph Current
    A[Landing + 3D avatar]
    B[Reflect / Decide / Learn]
    C[Roadmap page]
  end
  subgraph Next
    D[Guidance product features]
    E[Notion knowledge sync]
  end
  A --> B --> C
  C --> D --> E`

const integrationsDiagram = `flowchart LR
  SAGE[SAGE MNKY]
  S1[Notion]
  S2[Supabase]
  S3[OpenAI]
  SAGE --> S1
  SAGE --> S2
  SAGE --> S3`

export default function SageRoadmapPage() {
  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <h1 className="font-bold tracking-tight text-foreground" style={{ fontSize: "var(--main-hero-title-size)" }}>
          Roadmap
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Backend portal for guidance product and reflection features. How SAGE MNKY fits the ecosystem and where it is headed.
        </p>
        <section className="mt-10 space-y-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>Ecosystem overview</CardTitle>
                  <CardDescription>Main site, Dojo, Verse, agent apps, and data layer.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={ecosystemDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>How SAGE MNKY connects to the rest of the ecosystem.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>SAGE MNKY app phases</CardTitle>
                  <CardDescription>Current state, next steps, and future guidance features.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={appPhasesDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Roadmap phases for this agent app.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>Integrations (SAGE)</CardTitle>
                  <CardDescription>Key services for guidance and reflection. See INTEGRATIONS-MASTER.md at repo root.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={integrationsDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Guidance-facing integrations aligned with INTEGRATIONS-MASTER.</TooltipContent>
          </Tooltip>
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
