#!/usr/bin/env node
/**
 * Optional: Delete the empty categories left after Phase 2 channel moves
 * (Palworld, POKÉ MNKY, KINK IT). Only run after channels have been moved
 * to Gaming and MNKY Apps.
 *
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE.
 * Run: pnpm exec dotenv -e .env.local -- node scripts/delete-discord-empty-categories-phase2.mjs [guildId]
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const GUILD_ID = process.argv[2] || "1069695816001933332";

const EMPTY_CATEGORY_IDS = [
  "1231960241147744266", // Palworld (channels moved to Gaming)
  "1455487195493171260", // POKÉ MNKY (channels moved to MNKY Apps)
  "1457594042333396993", // KINK IT (channels moved to MNKY Apps)
];

const token = process.env.DISCORD_BOT_TOKEN_MNKY_VERSE;
if (!token) {
  console.error("DISCORD_BOT_TOKEN_MNKY_VERSE is not set.");
  process.exit(1);
}

async function discordRequest(method, path) {
  const res = await fetch(`${DISCORD_API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bot ${token}` },
  });
  if (!res.ok) throw new Error(`Discord API ${res.status}: ${await res.text()}`);
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  console.log("Deleting empty Phase 2 categories (Palworld, POKÉ MNKY, KINK IT)...\n");
  for (const id of EMPTY_CATEGORY_IDS) {
    await discordRequest("DELETE", `/channels/${id}`);
    console.log("Deleted category", id);
  }
  console.log("\nDone. Refresh server map: pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs", GUILD_ID);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
