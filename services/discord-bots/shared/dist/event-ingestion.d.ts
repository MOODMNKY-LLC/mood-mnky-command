/**
 * Send Discord events to the web app for gamification (ledger + quest evaluate).
 * Requires MOODMNKY_API_KEY and VERSE_APP_URL.
 */
export type DiscordEventType = "joined" | "message" | "reaction" | "voice_minutes" | "attachment_posted" | "thread_reply";
export type DiscordEventPayload = {
    profileId: string;
    discordUserId: string;
    guildId: string;
    channelId?: string;
    eventType: DiscordEventType;
    eventRef?: string;
    value?: number;
};
export declare function sendDiscordEvent(baseUrl: string, apiKey: string, payload: DiscordEventPayload): Promise<{
    ok: boolean;
    error?: string;
}>;
//# sourceMappingURL=event-ingestion.d.ts.map