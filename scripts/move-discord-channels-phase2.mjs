#!/usr/bin/env node
/**
 * Discord Phase 2: Create "Gaming" category, move Palworld channels into it,
 * and move #rules under "Welcome to MOOD MNKY!".
 * Run after discord-phase2-apps-category.mjs (or independently).
 *
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE.
 * Run: pnpm exec dotenv -e .env.local -- node scripts/move-discord-channels-phase2.mjs [guildId]
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const GUILD_ID = process.argv[2] || "1069695816001933332";

const WELCOME_CATEGORY_ID = "1069695816966615182";
const RULES_CHANNEL_ID = "1078917875605192764";
const PALWORLD_LIVE_SERVER = "1231960400996597832";
const PALWORLD_PAL_MNKY = "1233533463261352029";

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
  console.log("Phase 2: Create Gaming category, move Palworld channels, move #rules to Welcome...\n");

  // 1. Create Gaming category (type 4)
  const gamingCategory = await discordRequest("POST", `/guilds/${GUILD_ID}/channels`, {
    name: "Gaming",
    type: 4,
  });
  console.log(`Created category "Gaming" (id: ${gamingCategory.id})`);

  const gamingParentId = gamingCategory.id;

  // 2. Move Palworld channels into Gaming
  await discordRequest("PATCH", `/channels/${PALWORLD_LIVE_SERVER}`, {
    parent_id: gamingParentId,
    position: 0,
  });
  console.log("Moved #live-server → Gaming");

  await discordRequest("PATCH", `/channels/${PALWORLD_PAL_MNKY}`, {
    parent_id: gamingParentId,
    position: 1,
  });
  console.log("Moved #pal-mnky → Gaming");

  // 3. Move #rules under Welcome category
  await discordRequest("PATCH", `/channels/${RULES_CHANNEL_ID}`, {
    parent_id: WELCOME_CATEGORY_ID,
  });
  console.log("Moved #rules → Welcome to MOOD MNKY!");

  console.log("\nDone. Refresh server map: pnpm exec dotenv -e .env.local -- node scripts/fetch-discord-server-map.mjs 1069695816001933332");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
