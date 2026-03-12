"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Conversation } from "@/components/ui/conversation"

export { ConversationContent, ConversationEmptyState } from "@/components/ui/conversation"

export type MainConversationProps = ComponentProps<typeof Conversation> & { mainClassName?: string }

export function MainConversation(props: MainConversationProps) {
  const { className, mainClassName, ...rest } = props
  return <Conversation className={cn("main-glass-panel rounded-xl", mainClassName, className)} {...rest} />
}
