"use client"

import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Expand } from "lucide-react"
import {
  Agent,
  AgentContent,
  AgentHeader,
} from "@/components/ai-elements/agent"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MainGlassCard } from "./main-glass-card"
import { MainAgentCardFull } from "./main-agent-card-full"
import { cn } from "@/lib/utils"
import { getAgentToolDef, getAgentToolDisplay } from "@/lib/main-agent-tools"

export interface MainAgentCardProps {
  slug: string
  displayName: string
  role: string
  description: string
  imagePath: string
  model?: string | null
  tools?: string[]
  /** When true, card shows "View full profile" and opens dialog. Default true. */
  withDialog?: boolean
  className?: string
}

const AGENT_ROUTES: Record<string, string> = {
  mood_mnky: "/dojo/agents/mood_mnky",
  sage_mnky: "/dojo/agents/sage_mnky",
  code_mnky: "/dojo/agents/code_mnky",
}

export function MainAgentCard({
  slug,
  displayName,
  role,
  description,
  imagePath,
  model,
  tools = [],
  withDialog = true,
  className,
}: MainAgentCardProps) {
  const profileHref = AGENT_ROUTES[slug] ?? "/dojo/chat"
  const chatHref = "/dojo/chat"
  const bio = description?.trim() || "No bio."

  const card = (
    <MainGlassCard
      className={cn(
        "group flex w-[200px] flex-shrink-0 flex-col transition-all duration-200 hover:shadow-lg",
        "aspect-[3/5] overflow-hidden",
        className
      )}
    >
      <Agent className="flex h-full flex-col border-0 bg-transparent p-0 shadow-none">
        <AgentHeader
          name={displayName}
          model={model ?? undefined}
          className="min-h-0 flex-shrink-0 border-b px-3 py-2"
          icon={
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <Image
                src={imagePath}
                alt={displayName}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          }
        />
        <AgentContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-3 pt-2">
          <p className="flex-shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {role}
          </p>
          <div
            className="min-h-0 flex-1 overflow-hidden overflow-y-auto overscroll-contain transition-[overflow] duration-200 group-hover:overflow-y-auto"
            style={{ scrollBehavior: "smooth" }}
          >
            <p className="text-xs text-muted-foreground">{bio}</p>
          </div>
          {tools.length > 0 && (
            <div className="flex flex-shrink-0 flex-wrap gap-1">
              <TooltipProvider>
                {tools.slice(0, 4).map((toolId) => {
                  const def = getAgentToolDef(toolId)
                  const label = getAgentToolDisplay(toolId)
                  const content = (
                    <Badge
                      key={toolId}
                      variant="outline"
                      className="text-[10px]"
                    >
                      {label}
                    </Badge>
                  )
                  if (def?.description) {
                    return (
                      <Tooltip key={toolId}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          {def.description}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }
                  return content
                })}
                {tools.length > 4 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{tools.length - 4}
                  </Badge>
                )}
              </TooltipProvider>
            </div>
          )}
          <div className="mt-auto flex flex-shrink-0 flex-wrap gap-1.5 pt-2">
            <Button asChild size="sm" className="h-7 text-xs" variant="ghost">
              <Link href={chatHref} className="gap-1">
                <MessageSquare className="h-3 w-3" />
                Chat
              </Link>
            </Button>
            {withDialog && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 flex-1 justify-center gap-1 text-xs"
                asChild
              >
                <DialogTrigger className="w-full">
                  <Expand className="h-3.5 w-3.5" />
                  Full profile
                </DialogTrigger>
              </Button>
            )}
            {!withDialog && (
              <Button asChild size="sm" className="h-7 text-xs" variant="ghost">
                <Link href={profileHref}>Profile</Link>
              </Button>
            )}
          </div>
        </AgentContent>
      </Agent>
    </MainGlassCard>
  )

  if (withDialog) {
    return (
      <Dialog>
        {card}
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle className="sr-only">{displayName}</DialogTitle>
          <MainAgentCardFull
            slug={slug}
            displayName={displayName}
            role={role}
            description={description}
            imagePath={imagePath}
            model={model}
            tools={tools}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return card
}
