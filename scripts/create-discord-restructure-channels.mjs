#!/usr/bin/env node
/**
 * Creates MNKY MAIN, MNKY VERSE, and MNKY LABZ channels per DISCORD-SERVER-RESTRUCTURE.md.
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE. Run: dotenv -e .env.local -- node scripts/create-discord-restructure-channels.mjs [guildId]
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const GUILD_ID = process.argv[2] || "1069695816001933332";

const token = process.env.DISCORD_BOT_TOKEN_MNKY_VERSE;
if (!token) {
  console.error("DISCORD_BOT_TOKEN_MNKY_VERSE is not set.");
  process.exit(1);
}

// Category IDs from fetch-discord-server-map.mjs output (refresh if categories change)
const CATEGORY_IDS = {
  "MNKY MAIN": "1475405844295323699",
  "MNKY VERSE": "1475405789475766433",
  "MNKY LABZ": "1475405415624867850",
};

const CHANNELS = [
  { parent: "MNKY MAIN", name: "community-hub", topic: null },
  { parent: "MNKY MAIN", name: "announcements-main", topic: null },
  { parent: "MNKY VERSE", name: "drops", topic: "Seasonal drops and MNKY BOX; announcements posted here." },
  { parent: "MNKY VERSE", name: "verse-blog", topic: null },
  { parent: "MNKY VERSE", name: "quests", topic: null },
  { parent: "MNKY VERSE", name: "dojo", topic: null },
  { parent: "MNKY LABZ", name: "blending-lab", topic: null },
  { parent: "MNKY LABZ", name: "formulas", topic: null },
  { parent: "MNKY LABZ", name: "glossary", topic: null },
  { parent: "MNKY LABZ", name: "fragrance-oils", topic: null },
];

async function createChannel(parentKey, name, topic) {
  const parentId = CATEGORY_IDS[parentKey];
  if (!parentId) {
    throw new Error(`Unknown category: ${parentKey}`);
  }
  const body = { name, type: 0, parent_id: parentId };
  if (topic) body.topic = topic;
  const res = await fetch(`${DISCORD_API_BASE}/guilds/${GUILD_ID}/channels`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Discord API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log(`Creating ${CHANNELS.length} channels in guild ${GUILD_ID}...`);
  for (const { parent, name, topic } of CHANNELS) {
    const ch = await createChannel(parent, name, topic);
    console.log(`Created #${ch.name} (${ch.id}) under ${parent}`);
  }
  console.log("Done. Run fetch-discord-server-map.mjs to refresh the map.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
