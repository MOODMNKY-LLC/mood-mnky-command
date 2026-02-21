"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Agent,
  AgentHeader,
  AgentContent,
  AgentInstructions,
  AgentOutput,
} from "@/components/ai-elements/agent";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export interface FlowiseAgentCardProps {
  id: string;
  chatflowId: string;
  displayName: string | null;
  overrideConfig: Record<string, unknown>;
  children: React.ReactNode;
  chatHref?: string;
  className?: string;
}

export function FlowiseAgentCard({
  id,
  chatflowId,
  displayName,
  overrideConfig,
  children,
  chatHref,
  className,
}: FlowiseAgentCardProps) {
  const name = displayName || chatflowId;
  const modelLabel =
    chatflowId.length > 20 ? `${chatflowId.slice(0, 20)}…` : chatflowId;
  const systemPreview =
    typeof overrideConfig?.systemMessage === "string"
      ? String(overrideConfig.systemMessage).slice(0, 200) +
        (String(overrideConfig.systemMessage).length > 200 ? "…" : "")
      : "Override config for this chatflow. Edit below and save.";

  return (
    <Agent key={id} className={cn("flex flex-col", className)}>
      <AgentHeader name={name} model={modelLabel} />
      <AgentContent>
        <AgentInstructions label="Config">{systemPreview}</AgentInstructions>
        {children}
        {Object.keys(overrideConfig).length > 0 && (
          <AgentOutput
            schema={`Override keys: ${Object.keys(overrideConfig).join(", ") || "none"}`}
          />
        )}
        {chatHref && (
          <Button size="sm" variant="outline" className="mt-2" asChild>
            <Link href={chatHref}>
              <MessageSquare className="mr-1 h-4 w-4" />
              Open in chat
            </Link>
          </Button>
        )}
      </AgentContent>
    </Agent>
  );
}
