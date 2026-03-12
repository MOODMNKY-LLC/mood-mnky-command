/**
 * OpenAI Agents SDK — server-side multi-agent workflows.
 *
 * Used for: LABZ agent workflows, platform AI-SQL (future), complex orchestration.
 * Not routed through Flowise. See docs/AI-SEPARATION-REPORT.md.
 *
 * Note: @openai/agents requires Zod v4. Project uses Zod v3.
 * Full Agent usage may require zod upgrade. This stub provides the factory pattern.
 */

// Re-export for future use when Zod v4 is adopted
// import { Agent, run, tool } from "@openai/agents";

export type AgentConfig = {
  name: string
  instructions: string
  tools?: unknown[]
  handoffs?: unknown[]
}

/**
 * Factory for creating agent instances.
 * Placeholder until Zod v4 adoption; replace with:
 *   import { Agent } from "@openai/agents";
 *   return new Agent(config);
 */
export function createAgent(_config: AgentConfig): unknown {
  // Stub: full implementation requires @openai/agents + Zod v4
  // Example usage when ready:
  // const agent = new Agent({ name, instructions, tools, handoffs });
  // const result = await run(agent, userInput);
  // return result.finalOutput;
  throw new Error(
    "OpenAI Agents SDK requires Zod v4. Upgrade zod or use streamText from AI SDK for server-side AI."
  )
}
