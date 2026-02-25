/**
 * Get agent reply from the web app (single source of truth for prompts and tools).
 * POST /api/discord/agent-reply with { agentSlug, message, discordUserId, channelId? }
 */
export type AgentReplyPayload = {
    agentSlug: string;
    message: string;
    discordUserId: string;
    channelId?: string;
};
export type AgentReplyResult = {
    text: string;
} | {
    error: string;
};
export declare function getAgentReply(baseUrl: string, apiKey: string, payload: AgentReplyPayload): Promise<AgentReplyResult>;
//# sourceMappingURL=agent-reply.d.ts.map