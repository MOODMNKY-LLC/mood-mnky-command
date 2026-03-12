"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { ConversationBar } from "@/components/ui/conversation-bar"

export type MainConversationBarProps = ComponentProps<typeof ConversationBar> & { mainClassName?: string }

export function MainConversationBar({ className, mainClassName, ...props }: MainConversationBarProps) {
  return (
    <ConversationBar className={cn("main-glass-panel rounded-xl overflow-hidden", mainClassName, className)} {...props} />
  )
}
