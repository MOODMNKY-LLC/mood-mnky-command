#!/usr/bin/env node
/**
 * Resolves the Discord guild (server) ID from NEXT_PUBLIC_DISCORD_INVITE_URL.
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE to call Discord API GET /invites/{code}.
 * Run: dotenv -e .env.local -e .env -- node scripts/get-discord-guild-id.mjs
 */

const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || "";
const token = process.env.DISCORD_BOT_TOKEN_MNKY_VERSE;

if (!token) {
  console.error("DISCORD_BOT_TOKEN_MNKY_VERSE is not set.");
  process.exit(1);
}

const match = inviteUrl.match(/discord\.gg\/([a-zA-Z0-9]+)/) || inviteUrl.match(/\/([a-zA-Z0-9]+)$/);
const code = match ? match[1] : inviteUrl.trim().split("/").pop();
if (!code) {
  console.error("Could not extract invite code from NEXT_PUBLIC_DISCORD_INVITE_URL:", inviteUrl);
  process.exit(1);
}

const url = `https://discord.com/api/v10/invites/${code}?with_counts=true`;
const res = await fetch(url, {
  headers: { Authorization: `Bot ${token}` },
});

if (!res.ok) {
  console.error("Discord API error:", res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const guildId = data.guild?.id;
if (!guildId) {
  console.error("Invite response missing guild.id:", data);
  process.exit(1);
}

console.log(guildId);
