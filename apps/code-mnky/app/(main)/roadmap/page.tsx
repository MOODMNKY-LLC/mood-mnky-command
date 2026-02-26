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
    MOOD[MOOD MNKY]
    SAGE[SAGE MNKY]
    CODE[CODE MNKY app]
  end
  subgraph Data
    Notion[Notion]
    Supabase[Supabase]
    GitHub[GitHub]
    Vercel[Vercel]
  end
  Main --> Dojo
  CODE --> Supabase
  CODE --> Notion
  CODE --> GitHub
  CODE --> Vercel
  MOOD --> Main
  SAGE --> Supabase
`

const appPhasesDiagram = `
flowchart TB
  subgraph Current
    A[Landing + 3D avatar]
    B[Snippets / DevOps / Step-by-step]
    C[Roadmap page]
  end
  subgraph Next
    D[API + infra docs]
    E[GitHub / Vercel integration]
    F[n8n / Flowise flows]
  end
  subgraph Future
    G[Code review automation]
    H[Deploy from portal]
  end
  A --> B --> C
  C --> D --> E --> F
  F --> G --> H
`

const integrationsDiagram = `
flowchart LR
  subgraph CODE integrations
    C1[Supabase]
    C2[GitHub]
    C3[Vercel]
    C4[n8n]
    C5[Flowise]
  end
  CODE[CODE MNKY]
  CODE --> C1
  CODE --> C2
  CODE --> C3
  CODE --> C4
  CODE --> C5
`

export default function CodeRoadmapPage() {
  return (
    <>
      <AgentNav />
      <main className="main-container w-full flex-1 py-12 md:py-16">
        <h1 className="font-bold tracking-tight text-foreground" style={{ fontSize: "var(--main-hero-title-size)" }}>
          Roadmap
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Backend portal for DevOps and ecosystem tooling. How CODE MNKY fits the stack and where it’s headed.
        </p>

        <section className="mt-10 space-y-10">
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>Ecosystem overview</CardTitle>
                  <CardDescription>Main site, Dojo, LABZ, Verse, Shopify, agent apps, and infra.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={ecosystemDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>This view shows how CODE MNKY connects to the technical ecosystem.</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="main-glass-panel border-border/50">
                <CardHeader>
                  <CardTitle>CODE MNKY app phases</CardTitle>
                  <CardDescription>Current state, next steps, and future technical integrations.</CardDescription>
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
                  <CardTitle>Integrations (CODE)</CardTitle>
                  <CardDescription>Key services for DevOps and tooling. See INTEGRATIONS-MASTER.md at repo root.</CardDescription>
                </CardHeader>
                <CardContent>
                  <MermaidDiagram diagram={integrationsDiagram} />
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>Technical integrations aligned with INTEGRATIONS-MASTER.</TooltipContent>
          </Tooltip>
        </section>
      </main>
      <AgentFooter />
    </>
  )
}
