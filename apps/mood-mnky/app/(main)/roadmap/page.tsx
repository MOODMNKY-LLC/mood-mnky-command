import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MermaidDiagram } from "@/components/mermaid-diagram"

const ecosystemDiagram = `
flowchart LR
  subgraph Brand
    Main[Main site]
    Dojo[Dojo]
    LABZ[LABZ]
    Verse[Verse]
    Shopify[Shopify]
  end
  subgraph Agents
    MOOD[MOOD MNKY app]
    SAGE[SAGE MNKY app]
    CODE[CODE MNKY app]
  end
  subgraph Data
    Notion[Notion]
    Supabase[Supabase]
  end
  Main --> Dojo
  Main --> Verse
  Main --> LABZ
  MOOD --> Main
  MOOD --> Supabase
  MOOD --> Notion
  MOOD --> Shopify
  SAGE --> Supabase
  SAGE --> Notion
  CODE --> Supabase
  CODE --> Notion
`

const appPhasesDiagram = `
flowchart TB
  subgraph Current
    A[Landing + 3D avatar]
    B[Sign in to main auth]
    C[Roadmap page]
  end
  subgraph Next
    D[Brand content sync]
    E[Dojo / Verse deep links]
    F[Integration badges + tooltips]
  end
  subgraph Future
    G[Voice or chat demos]
    H[Notion-driven copy]
  end
  A --> B --> C
  C --> D --> E --> F
  F --> G --> H
`

const integrationsDiagram = `
flowchart LR
  subgraph MOOD integrations
    M1[Main site]
    M2[Supabase]
    M3[Notion]
    M4[Shopify]
    M5[Dojo / Verse]
  end
  MOOD[MOOD MNKY]
  MOOD --> M1
  MOOD --> M2
  MOOD --> M3
  MOOD --> M4
  MOOD --> M5
`

export default function MoodRoadmapPage() {
  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <h1 className="font-bold tracking-tight text-foreground" style={{ fontSize: "var(--main-hero-title-size)" }}>
          Roadmap
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Backend portal for brand representation and customer engagement. How MOOD MNKY fits the ecosystem and where it’s headed.
        </p>

        <section className="mt-10 space-y-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>Ecosystem overview</CardTitle>
                  <CardDescription>Main site, Dojo, LABZ, Verse, Shopify, agent apps, and data layer.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={ecosystemDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>This view shows how MOOD MNKY connects to the rest of the brand ecosystem.</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>MOOD MNKY app phases</CardTitle>
                  <CardDescription>Current state, next steps, and future integrations.</CardDescription>
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
                  <CardTitle>Integrations (MOOD)</CardTitle>
                  <CardDescription>Key services this portal uses or will use. See INTEGRATIONS-MASTER.md at repo root.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={integrationsDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Brand-facing integrations aligned with INTEGRATIONS-MASTER.</TooltipContent>
          </Tooltip>
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
