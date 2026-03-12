"use client";

import type { ComponentProps } from "react";
import {
  Plan,
  PlanContent,
  PlanDescription,
  PlanHeader,
  PlanTitle,
  PlanTrigger,
} from "@/components/ai-elements/plan";
import { cn } from "@/lib/utils";

export interface FlowisePlanStep {
  title: string;
  description?: string;
  content?: string;
}

export interface FlowisePlanProps extends Omit<ComponentProps<"div">, "children"> {
  /** Plan title (e.g. "Execution plan", "Task breakdown"). */
  title?: string;
  /** Plan steps from Flowise agent tools or plan stream event. */
  steps: FlowisePlanStep[];
  /** Show shimmer for streaming. */
  isStreaming?: boolean;
}

/**
 * Renders AI-generated execution plans from Flowise agents.
 * Use when tools return structured plan data or when a "plan" stream event is received.
 */
export function FlowisePlan({
  title = "Execution plan",
  steps,
  isStreaming = false,
  className,
  ...props
}: FlowisePlanProps) {
  if (!steps?.length) return null;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {steps.map((step, i) => (
        <Plan key={i} isStreaming={isStreaming} defaultOpen={i === 0}>
          <PlanHeader>
            <div className="flex flex-1 flex-col gap-1">
              <PlanTitle>{step.title}</PlanTitle>
              {step.description ? (
                <PlanDescription>{step.description}</PlanDescription>
              ) : null}
            </div>
            <PlanTrigger />
          </PlanHeader>
          <PlanContent>
            {step.content ? (
              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                {step.content}
              </p>
            ) : null}
          </PlanContent>
        </Plan>
      ))}
    </div>
  );
}
