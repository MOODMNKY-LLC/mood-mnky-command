"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SuggestionsProps = ComponentProps<"div">

export function Suggestions({ className, ...props }: SuggestionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2",
        className
      )}
      role="list"
      {...props}
    />
  )
}

export type SuggestionProps = Omit<
  ComponentProps<typeof Button>,
  "onClick"
> & {
  suggestion: string
  onClick?: (suggestion: string) => void
  icon?: React.ReactNode
}

export function Suggestion({
  suggestion,
  onClick,
  icon,
  className,
  variant = "outline",
  size = "sm",
  ...props
}: SuggestionProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("font-normal", className)}
      onClick={() => onClick?.(suggestion)}
      role="listitem"
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {suggestion}
    </Button>
  )
}
