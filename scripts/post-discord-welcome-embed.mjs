#!/usr/bin/env node
/**
 * Posts a rich embed welcome message to #welcome-and-rules and pins it.
 * Uses DISCORD_BOT_TOKEN_MNKY_VERSE and VERSE_APP_URL (or NEXT_PUBLIC_APP_URL).
 * Run: pnpm exec dotenv -e .env.local -- node scripts/post-discord-welcome-embed.mjs
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";
const WELCOME_CHANNEL_ID = "1069695816966615183";

const token = process.env.DISCORD_BOT_TOKEN_MNKY_VERSE;
const baseUrl = (process.env.VERSE_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

if (!token) {
  console.error("DISCORD_BOT_TOKEN_MNKY_VERSE is not set.");
  process.exit(1);
}

function buildEmbed() {
  const linkUrl = baseUrl ? baseUrl + "/verse/auth/discord/link" : "{APP_URL}/verse/auth/discord/link";
  const communityUrl = baseUrl ? baseUrl + "/verse/community" : "{APP_URL}/verse/community";
  // Copy and field order refined with mood-mnky (brand voice) and sage-mnky (structure: action first).
  return {
    title: "Welcome to MOOD MNKY",
    description: "Your home for fragrance, wellness, and the MNKY VERSE. Explore, blend, and connect.",
    color: 0x181619,
    thumbnail: baseUrl ? { url: baseUrl + "/mood-mnky-icon.svg" } : undefined,
    fields: [
      {
        name: "Get started",
        value: "1. Read the rules below.\n2. Say hi in **#general** if you like.\n3. **Link Discord** in the app so quests count: " + linkUrl + "\n4. Explore: " + communityUrl + " — drops, quests, blending.",
        inline: false,
      },
      {
        name: "What's here",
        value: "**MNKY VERSE** — Drops, blog, quests, and the Dojo. Link Discord in-app to earn XP and rewards.\n**MNKY LABZ** — Blending Lab, formulas, and fragrance discovery.\n**MNKY SHOP** — Products, rewards, and store chat.",
        inline: false,
      },
      {
        name: "Slash commands",
        value: "**/verse** — Dojo & drops · **/mood** — fragrance · **/sage** — learning · **/code** — dev & LABZ",
        inline: false,
      },
    ],
    footer: { text: "Always scentsing the MOOD." },
  };
}

async function discordRequest(method, path, body = null) {
  const opts = {
    method,
    headers: { Authorization: "Bot " + token },
  };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(DISCORD_API_BASE + path, opts);
  if (!res.ok) throw new Error("Discord API " + res.status + ": " + (await res.text()));
  if (res.status === 204) return null;
  return res.json();
}

async function main() {
  const embed = buildEmbed();
  const msg = await discordRequest("POST", "/channels/" + WELCOME_CHANNEL_ID + "/messages", { embeds: [embed] });
  console.log("Posted welcome embed (message id: " + msg.id + ")");
  await discordRequest("PUT", "/channels/" + WELCOME_CHANNEL_ID + "/pins/" + msg.id);
  console.log("Pinned the welcome message.");
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
