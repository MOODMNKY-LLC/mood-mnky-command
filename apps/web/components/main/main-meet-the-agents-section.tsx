"use client"

import type { MainLandingAgentItem } from "@/lib/main-landing-data"
import type { MainTryMoodMnkyConfig } from "@/components/main/main-try-mood-mnky-section"
import { MainAgentCard } from "@/components/main/main-agent-card"
import { MainTryMoodMnkySection } from "@/components/main/main-try-mood-mnky-section"
import { cn } from "@/lib/utils"

function roleFromDisplayName(displayName: string): string {
  const first = displayName.split(" ")[0]
  return first ?? displayName
}

export interface MainMeetTheAgentsSectionProps {
  agents: MainLandingAgentItem[]
  config: MainTryMoodMnkyConfig
  className?: string
}

/**
 * Unified "Meet the Agents" section: agent character cards plus Connect CTAs (Chat, Voice, Listen).
 */
export function MainMeetTheAgentsSection({
  agents,
  config,
  className,
}: MainMeetTheAgentsSectionProps) {
  return (
    <section
      className={cn("space-y-8", className)}
      style={{ marginTop: "var(--main-section-gap)" }}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Meet the Agents
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Your AI companions—explore, learn, and connect.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {agents.map((agent) => (
          <MainAgentCard
            key={agent.slug}
            slug={agent.slug}
            displayName={agent.displayName}
            role={roleFromDisplayName(agent.displayName)}
            description={agent.blurb ?? ""}
            imagePath={agent.imagePath}
            model={agent.model}
            tools={agent.tools}
          />
        ))}
      </div>

      <MainTryMoodMnkySection config={config} showHeading={false} />
    </section>
  )
}
