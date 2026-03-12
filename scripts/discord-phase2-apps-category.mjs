#!/usr/bin/env node
/**
 * Discord Phase 2: Create "MNKY Apps" category and move POKÉ MNKY + KINK IT
 * announcements into it with renames (poke-mnky, kink-it). Gaming (Palworld)
 * stays separate.
 *
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE.
 * Run: pnpm exec dotenv -e .env.local -- node scripts/discord-phase2-apps-category.mjs [guildId]
 *
 * Exact Discord API operations:
 * 1. POST /guilds/:guildId/channels  Body: { "name": "MNKY Apps", "type": 4 }
 *    → returns { id } for the new category (type 4 = category).
 * 2. PATCH /channels/1455487289814945899  Body: { "parent_id": "<newCategoryId>", "name": "poke-mnky" }
 * 3. PATCH /channels/1457594125590462548  Body: { "parent_id": "<newCategoryId>", "name": "kink-it" }
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const GUILD_ID = process.argv[2] || "1069695816001933332";

const CHANNEL_IDS = {
  POKE_ANNOUNCEMENTS: "1455487289814945899",
  KINK_IT_ANNOUNCEMENTS: "1457594125590462548",
};

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
  console.log("Phase 2: Create MNKY Apps category and move app announcement channels...\n");

  // 1. Create category (type 4)
  const category = await discordRequest("POST", `/guilds/${GUILD_ID}/channels`, {
    name: "MNKY Apps",
    type: 4,
  });
  console.log(`Created category "MNKY Apps" (id: ${category.id})`);

  const parentId = category.id;

  // 2. Move and rename POKÉ MNKY #announcements → #poke-mnky
  await discordRequest("PATCH", `/channels/${CHANNEL_IDS.POKE_ANNOUNCEMENTS}`, {
    parent_id: parentId,
    name: "poke-mnky",
  });
  console.log(`Moved POKÉ MNKY announcements → #poke-mnky (parent: MNKY Apps)`);

  // 3. Move and rename KINK IT #announcements → #kink-it
  await discordRequest("PATCH", `/channels/${CHANNEL_IDS.KINK_IT_ANNOUNCEMENTS}`, {
    parent_id: parentId,
    name: "kink-it",
  });
  console.log(`Moved KINK IT announcements → #kink-it (parent: MNKY Apps)`);

  console.log("\nDone. Refresh server map: pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs > docs/DISCORD-SERVER-MAP.md");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
