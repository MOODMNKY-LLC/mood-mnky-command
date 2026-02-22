"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import {
  Agent,
  AgentContent,
  AgentHeader,
  AgentInstructions,
} from "@/components/ai-elements/agent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getAgentToolDef, getAgentToolDisplay } from "@/lib/main-agent-tools"

export interface MainAgentCardFullProps {
  slug: string
  displayName: string
  role: string
  description: string
  imagePath: string
  model?: string | null
  tools: string[]
  className?: string
}

const AGENT_ROUTES: Record<string, string> = {
  mood_mnky: "/verse/agents/mood_mnky",
  sage_mnky: "/verse/agents/sage_mnky",
  code_mnky: "/verse/agents/code_mnky",
}

export function MainAgentCardFull({
  slug,
  displayName,
  role,
  description,
  imagePath,
  model,
  tools,
  className,
}: MainAgentCardFullProps) {
  const profileHref = AGENT_ROUTES[slug] ?? "/verse/chat"
  const chatHref = "/verse/chat"
  const bio = description?.trim() || "No bio."

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-card text-card-foreground",
        className
      )}
    >
      <Agent className="flex h-full flex-col border-0 bg-transparent p-0 shadow-none">
        <AgentHeader
          name={displayName}
          model={model ?? undefined}
          icon={
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
              <Image
                src={imagePath}
                alt={displayName}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          }
        />
        <AgentContent className="flex flex-1 flex-col gap-4 pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {role}
          </p>
          <AgentInstructions label="Bio">{bio}</AgentInstructions>
          {tools.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Capabilities
              </h4>
              <TooltipProvider>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((toolId) => {
                    const def = getAgentToolDef(toolId)
                    const label = getAgentToolDisplay(toolId)
                    const content = (
                      <Badge
                        key={toolId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {label}
                      </Badge>
                    )
                    if (def?.description) {
                      return (
                        <Tooltip key={toolId}>
                          <TooltipTrigger asChild>{content}</TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-xs"
                          >
                            {def.description}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }
                    return content
                  })}
                </div>
              </TooltipProvider>
            </div>
          )}
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            <Button asChild size="sm">
              <Link href={chatHref} className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Chat
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={profileHref}>View profile page</Link>
            </Button>
          </div>
        </AgentContent>
      </Agent>
    </div>
  )
}
