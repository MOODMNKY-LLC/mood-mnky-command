"use client";

import { DojoFlowiseChatbot } from "@/components/dojo/dojo-flowise-chatbot";

export interface FlowiseChatUIProps {
  chatflowId?: string;
  overrideConfig?: Record<string, unknown>;
  className?: string;
}

/**
 * Unified Flowise chat interface. Wraps DojoFlowiseChatbot which composes
 * Elements AI SDK (Conversation, Message, PromptInput, Tool, Reasoning, etc.)
 * and connects to /api/flowise/predict.
 */
export function FlowiseChatUI({
  chatflowId,
  overrideConfig,
  className,
}: FlowiseChatUIProps) {
  return (
    <DojoFlowiseChatbot
      chatflowId={chatflowId}
      overrideConfig={overrideConfig}
      className={className}
    />
  );
}
