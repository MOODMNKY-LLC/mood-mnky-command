"use client"

import type { ComponentProps } from "react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { BrainIcon, ChevronDownIcon } from "lucide-react"
import { MessageResponse } from "./message"

export type ReasoningProps = ComponentProps<typeof Collapsible>

export const Reasoning = ({ className, ...props }: ReasoningProps) => (
  <Collapsible
    className={cn("group not-prose mb-4 w-full rounded-md border", className)}
    defaultOpen={false}
    {...props}
  />
)

export type ReasoningTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  label?: string
}

export const ReasoningTrigger = ({
  className,
  label = "View reasoning",
  ...props
}: ReasoningTriggerProps) => (
  <CollapsibleTrigger
    className={cn(
      "flex w-full items-center justify-between gap-4 p-3 text-left",
      className,
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <BrainIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{label}</span>
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
)

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent>

export const ReasoningContent = ({ className, ...props }: ReasoningContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 space-y-4 p-4 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className,
    )}
    {...props}
  />
)

export type ReasoningTextProps = ComponentProps<"div"> & {
  text: string
}

export const ReasoningText = ({ className, text, ...props }: ReasoningTextProps) => (
  <div
    className={cn(
      "overflow-x-auto rounded-md bg-muted/50 p-3 text-xs whitespace-pre-wrap",
      className,
    )}
    {...props}
  >
    <MessageResponse>{text}</MessageResponse>
  </div>
)
