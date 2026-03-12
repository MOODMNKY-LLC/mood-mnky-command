"use client";

import { FlowiseChatflowControlPanel } from "@/components/flowise-mnky/flowise-chatflow-control-panel";

export type FlowiseAssignment = {
  id: string;
  profile_id: string;
  chatflow_id: string;
  display_name: string | null;
  override_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function DojoFlowiseConfigClient() {
  return <FlowiseChatflowControlPanel />;
}
