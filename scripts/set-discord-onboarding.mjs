#!/usr/bin/env node
/**
 * Sets Discord Community Server onboarding: default channels and optionally enabled.
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE. Bot needs MANAGE_GUILD.
 * Run: pnpm exec dotenv -e .env.local -- node scripts/set-discord-onboarding.mjs [guildId]
 *
 * GET /guilds/:id/onboarding → then PUT with default_channel_ids and enabled.
 * Optional: set prompts (e.g. "What brings you here?" with options and role_ids/channel_ids).
 * See docs/DISCORD-ROLES-AND-ONBOARDING.md for prompt→role mapping and implementation order.
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const GUILD_ID = process.argv[2] || "1069695816001933332";

const DEFAULT_CHANNEL_IDS = [
  "1069695816966615183", // #welcome-and-rules
  "1069695816966615184", // #announcements
  "1069695816966615187", // #general (Text Channels)
];

// Optional: onboarding prompts with role_ids/channel_ids (fill after creating roles; see DISCORD-ROLES-AND-ONBOARDING.md).
// Example: { id: null, title: "What brings you here?", options: [{ label: "Drops & quests", role_ids: [VERSE_ROLE_ID], channel_ids: [...] }, ...] }
const ONBOARDING_PROMPTS = null; // Set to array to send prompts; null = preserve current.prompts from API.

const token = process.env.DISCORD_BOT_TOKEN_MNKY_VERSE;
if (!token) {
  console.error("DISCORD_BOT_TOKEN_MNKY_VERSE is not set.");
  process.exit(1);
}

async function discordRequest(method, path, body = null) {
  const opts = {
    method,
    headers: { Authorization: `Bot ${token}` },
  };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${DISCORD_API_BASE}${path}`, opts);
  if (!res.ok) throw new Error(`Discord API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  console.log("Fetching current onboarding...\n");

  const current = await discordRequest("GET", `/guilds/${GUILD_ID}/onboarding`);
  console.log("Current onboarding:", current.enabled ? "enabled" : "disabled", "| default channels:", current.default_channel_ids?.length ?? 0);

  const body = {
    enabled: true,
    default_channel_ids: DEFAULT_CHANNEL_IDS,
    prompts: ONBOARDING_PROMPTS ?? current.prompts ?? [],
    mode: current.mode ?? 0,
  };

  await discordRequest("PUT", `/guilds/${GUILD_ID}/onboarding`, body);
  console.log("Onboarding updated: enabled=true, default_channel_ids=[#welcome-and-rules, #announcements, #general]");
  console.log("Existing prompts preserved. Set Rules Screening and customize prompts in Server Settings → Onboarding.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
