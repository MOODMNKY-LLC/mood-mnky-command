"use client"

import type { ComponentProps } from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { ChevronDown, Loader2 } from "lucide-react"

export type ChainOfThoughtStepStatus = "pending" | "active" | "complete"

export interface ChainOfThoughtStep {
  id: string
  title?: string
  content?: string
  status: ChainOfThoughtStepStatus
}

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  steps: ChainOfThoughtStep[]
  defaultOpen?: boolean
}

export function ChainOfThought({
  steps,
  defaultOpen = true,
  className,
  ...props
}: ChainOfThoughtProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border bg-muted/30 overflow-hidden",
        className
      )}
      {...props}
    >
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm font-medium hover:bg-muted/50 transition-colors [&[data-state=open]_.chevron]:rotate-180">
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            Thinking steps
          </span>
          <ChevronDown className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t divide-y">
            {steps.map((step, index) => (
              <ChainOfThoughtStepItem key={step.id} step={step} index={index} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export type ChainOfThoughtStepItemProps = {
  step: ChainOfThoughtStep
  index: number
}

function ChainOfThoughtStepItem({ step, index }: ChainOfThoughtStepItemProps) {
  const isActive = step.status === "active"
  const isComplete = step.status === "complete"
  return (
    <div
      className={cn(
        "flex gap-3 px-3 py-2.5 text-sm",
        isActive && "bg-muted/50",
        isComplete && "text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
          isComplete && "bg-primary/10 text-primary",
          isActive && "bg-primary text-primary-foreground",
          step.status === "pending" && "bg-muted text-muted-foreground"
        )}
      >
        {isComplete ? "✓" : index + 1}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        {step.title && (
          <p className="font-medium text-foreground">{step.title}</p>
        )}
        {step.content && (
          <p className="text-muted-foreground whitespace-pre-wrap">
            {step.content}
          </p>
        )}
      </div>
    </div>
  )
}
