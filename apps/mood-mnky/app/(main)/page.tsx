import { AgentNav } from "@/components/agent-nav"
import { AgentFooter } from "@/components/agent-footer"
import { AgentHero } from "@/components/agent-hero"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Sparkles, Palette, Shield } from "lucide-react"

const features = [
  {
    icon: Sparkles,
    title: "Brand narrative",
    description: "Stories behind each fragrance. Scents connected to memories and emotions.",
    tooltip: "Brand narrative: the stories behind each fragrance and how they connect to the MOOD MNKY world.",
    hoverContent: "We use narrative to guide customers through the Dojo, Verse, and Blending Lab—so every touchpoint feels cohesive and on-brand.",
  },
  {
    icon: Palette,
    title: "Extreme personalization",
    description: "Bespoke fragrance and the MNKY DOJO. Explore the Blending Lab.",
    tooltip: "Extreme personalization: bespoke fragrance, Dojo, and Blending Lab experiences.",
    hoverContent: "From custom scent profiles to the Blending Lab, this portal supports the tools that make each customer journey unique.",
  },
  {
    icon: Shield,
    title: "Security & privacy",
    description: "Secure, private, and respectful. Best practices in every interaction.",
    tooltip: "Security & privacy: we follow best practices so every interaction is safe and respectful.",
    hoverContent: "Credentials and user data are handled with care; this app is the backend portal for brand representation and customer engagement.",
  },
]

const integrations = [
  { name: "Main site", use: "Landing, Dojo, Verse; brand home." },
  { name: "Supabase", use: "Auth, profiles, storage; shared across ecosystem." },
  { name: "Notion", use: "Content and credentials hub; knowledge base." },
  { name: "Shopify", use: "Product narrative, collections, storefront." },
] as const

export default function MoodMnkyLanding() {
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
          <span className="text-sm text-muted-foreground">Ecosystem:</span>
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
