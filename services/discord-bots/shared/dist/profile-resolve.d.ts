/**
 * Resolve Discord user ID to web app profile ID (for event ingestion).
 * Calls GET /api/discord/profile-by-discord-id?discordUserId=...
 * Returns null on any failure (network, non-OK, or non-JSON) so the bot does not crash.
 */
export declare function getProfileIdByDiscordUserId(baseUrl: string, apiKey: string, discordUserId: string): Promise<string | null>;
//# sourceMappingURL=profile-resolve.d.ts.map