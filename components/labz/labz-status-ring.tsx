"use client";

import { cn } from "@/lib/utils";
import type { PersonaState } from "@/components/ai-elements/persona";

export type StatusOverride = "error" | "warning";

export interface LabzStatusRingProps {
  /** Persona state (idle, listening, thinking, speaking, asleep). */
  state: PersonaState;
  /** Override ring color from chat/request status; takes precedence over state. */
  statusOverride?: StatusOverride | null;
  /** Optional animation for active states (listening, thinking). */
  animate?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Resolves ring color: statusOverride (error/warning) wins, then state map.
 * Blue=ready, green=active, red=record/error, yellow=warning, muted=asleep.
 */
function getRingClasses(
  state: PersonaState,
  statusOverride?: StatusOverride | null,
  animate?: boolean
): string {
  if (statusOverride === "error") {
    return "border-destructive" + (animate ? " animate-pulse" : "");
  }
  if (statusOverride === "warning") {
    return "border-warning" + (animate ? " animate-pulse" : "");
  }
  switch (state) {
    case "listening":
      return "border-destructive" + (animate ? " animate-pulse" : "");
    case "thinking":
    case "speaking":
      return "border-status-active" + (animate ? " animate-pulse" : "");
    case "asleep":
      return "border-muted-foreground/50";
    case "idle":
    default:
      return "border-status-ready";
  }
}

/**
 * Status ring wrapper: same circumference as content. Uses semantic colors
 * (blue=ready, green=active, red=record/error, yellow=warning) and optional pulse.
 */
export function LabzStatusRing({
  state,
  statusOverride,
  animate = true,
  className,
  children,
}: LabzStatusRingProps) {
  const ringClasses = getRingClasses(state, statusOverride, animate);

  return (
    <div
      className={cn(
        "rounded-full border-2 transition-colors duration-200",
        ringClasses,
        className
      )}
    >
      {children}
    </div>
  );
}
