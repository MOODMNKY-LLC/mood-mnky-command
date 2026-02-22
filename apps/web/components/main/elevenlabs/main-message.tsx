"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Message } from "@/components/ui/message"

export type MainMessageProps = ComponentProps<typeof Message> & {
  mainClassName?: string
}

export function MainMessage({
  className,
  mainClassName,
  ...props
}: MainMessageProps) {
  return (
    <Message
      className={cn("main-glass-panel rounded-xl px-4 py-3", mainClassName, className)}
      {...props}
    />
  )
}
