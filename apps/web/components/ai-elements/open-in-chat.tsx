"use client"

import type { ComponentProps } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ExternalLink, MessageCircle } from "lucide-react"

const PLATFORMS = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: (q: string) =>
      `https://chat.openai.com/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "claude",
    name: "Claude",
    url: (q: string) =>
      `https://claude.ai/new?query=${encodeURIComponent(q)}`,
  },
  {
    id: "v0",
    name: "v0",
    url: (q: string) =>
      `https://v0.dev/chat?q=${encodeURIComponent(q)}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    url: (q: string) =>
      `https://cursor.com/?q=${encodeURIComponent(q)}`,
  },
] as const

export type OpenInChatProps = ComponentProps<"div"> & {
  query: string
  trigger?: React.ReactNode
  triggerClassName?: string
}

export function OpenInChat({
  query,
  trigger,
  triggerClassName,
  className,
  ...props
}: OpenInChatProps) {
  return (
    <div className={cn("inline-block", className)} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger ?? (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 text-muted-foreground hover:text-foreground",
                triggerClassName
              )}
            >
              <MessageCircle className="h-4 w-4" />
              Open in...
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Open query in</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {PLATFORMS.map((platform) => (
              <DropdownMenuItem key={platform.id} asChild>
                <a
                  href={platform.url(query)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  {platform.name}
                  <ExternalLink className="ml-auto h-3 w-3 opacity-70" />
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
