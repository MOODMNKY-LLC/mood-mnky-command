"use client"

import type { ComponentProps } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Check, Circle } from "lucide-react"

export interface QueueTodo {
  id: string
  title: string
  description?: string
  status?: "pending" | "completed"
}

export type QueueProps = ComponentProps<"div">

export function Queue({ className, ...props }: QueueProps) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      role="list"
      {...props}
    />
  )
}

export type QueueContentProps = ComponentProps<"div">

export function QueueContent({ className, children, ...props }: QueueContentProps) {
  return (
    <ScrollArea className={cn("max-h-[320px]", className)}>
      <div className="p-3 space-y-1">{children}</div>
    </ScrollArea>
  )
}

export type QueueTodoItemProps = ComponentProps<"div"> & {
  item: QueueTodo
}

export function QueueTodoItem({ item, className, ...props }: QueueTodoItemProps) {
  const isCompleted = item.status === "completed"
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50",
        className
      )}
      role="listitem"
      {...props}
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
        {isCompleted ? (
          <Check className="h-4 w-4 text-primary" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "font-medium",
            isCompleted && "text-muted-foreground line-through"
          )}
        >
          {item.title}
        </span>
        {item.description != null && item.description !== "" && (
          <p className="mt-0.5 text-muted-foreground">{item.description}</p>
        )}
      </div>
    </div>
  )
}
